import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createHmac } from "crypto";
import { clearCookies, cookieJar } from "../helpers/session";
import { setSessionCookie } from "@/lib/auth";
import { db } from "@/db";
import { clients, invoices, leads, users } from "@/db/schema";
import { eq } from "drizzle-orm";

// The real handlers — no HTTP server involved.
import { GET as adminGet, POST as adminPost, PATCH as adminPatch } from "@/app/api/admin/[...slug]/route";
import { POST as authPost } from "@/app/api/auth/[action]/route";
import { POST as portalPost } from "@/app/api/portal/[action]/route";
import { POST as paymentWebhook } from "@/app/api/webhooks/payment/route";

type Ctx = { params: Promise<Record<string, string | string[]>> };

const jsonReq = (url: string, body?: unknown, init: RequestInit = {}) =>
  new Request(url, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json" },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    ...init,
  });

async function loginAsAdmin() {
  await setSessionCookie({ sub: 1, role: "admin", email: "owner@visionfold.test", name: "Owner" });
}

beforeAll(async () => {
  // Deterministic secret for session signing + webhook HMAC.
  process.env.JWT_SECRET = "test-secret-for-integration-suite";
  // Staff accounts for each role — sessions are validated against these rows.
  const { hashPassword } = await import("@/lib/auth");
  const existing = await db.select().from(users).where(eq(users.id, 1)).limit(1);
  if (!existing[0]) {
    await db.insert(users).values({
      email: "owner@visionfold.test",
      name: "Owner",
      passwordHash: hashPassword("test-pass-123"),
      role: "admin",
    });
  }
});

describe("auth & session security", () => {
  it("rejects a wrong password without setting a session", async () => {
    clearCookies();
    const res = await authPost(
      jsonReq("http://localhost/api/auth/login", { email: "owner@visionfold.test", password: "wrong" }),
      { params: Promise.resolve({ action: "login" }) }
    );
    expect(res.status).toBe(400);
    expect(cookieJar().size).toBe(0);
  });

  it("blocks unauthenticated access to admin APIs", async () => {
    clearCookies();
    const res = await adminGet(jsonReq("http://localhost/api/admin/dashboard"), {
      params: Promise.resolve({ slug: ["dashboard"] }),
    });
    expect(res.status).toBe(401);
  });
});

describe("RBAC", () => {
  it("accountant role cannot read the blog area", async () => {
    clearCookies();
    // Role is validated against the DB row, so create a real accountant.
    const { hashPassword } = await import("@/lib/auth");
    const [acct] = await db
      .insert(users)
      .values({
        email: `fin-${Date.now()}@visionfold.test`,
        name: "Fin",
        passwordHash: hashPassword("test-pass-123"),
        role: "accountant",
      })
      .returning();
    await setSessionCookie({ sub: acct.id, role: "accountant", email: acct.email, name: acct.name });
    const res = await adminGet(jsonReq("http://localhost/api/admin/blog"), {
      params: Promise.resolve({ slug: ["blog"] }),
    });
    expect(res.status).toBe(403);
    await loginAsAdmin();
  });

  it("editor role cannot write site settings", async () => {
    clearCookies();
    const { hashPassword } = await import("@/lib/auth");
    const [ed] = await db
      .insert(users)
      .values({
        email: `ed-${Date.now()}@visionfold.test`,
        name: "Ed",
        passwordHash: hashPassword("test-pass-123"),
        role: "editor",
      })
      .returning();
    await setSessionCookie({ sub: ed.id, role: "editor", email: ed.email, name: ed.name });
    const res = await adminPost(jsonReq("http://localhost/api/admin/settings", { siteTitle: "Hacked" }), {
      params: Promise.resolve({ slug: ["settings"] }),
    });
    expect(res.status).toBe(403);
    await loginAsAdmin();
  });
});

describe("portal ownership isolation", () => {
  it("a client can only mint payment links for their own invoices", async () => {
    // Two clients with one invoice each.
    const { hashPassword } = await import("@/lib/auth");
    const [a] = await db
      .insert(clients)
      .values({ name: "Alice A", email: `alice-${Date.now()}@t.test`, passwordHash: hashPassword("password123"), status: "active" })
      .returning();
    const [b] = await db
      .insert(clients)
      .values({ name: "Bob B", email: `bob-${Date.now()}@t.test`, passwordHash: hashPassword("password123"), status: "active" })
      .returning();
    const [invA] = await db
      .insert(invoices)
      .values({ clientId: a.id, number: `ALICE-${Date.now()}`, amount: "100.00", status: "sent" })
      .returning();

    clearCookies();
    await setSessionCookie({ sub: b.id, role: "client", email: b.email, name: b.name });
    const res = await portalPost(jsonReq("http://localhost/api/portal/paylink", { invoiceId: invA.id }), {
      params: Promise.resolve({ action: "paylink" }),
    });
    expect(res.status).toBe(404);
    await loginAsAdmin();
  });
});

describe("payment webhook — signed, idempotent, transactional", () => {
  it("marks an invoice paid exactly once and only with a valid signature", async () => {
    const [client] = await db
      .insert(clients)
      .values({ name: "Payee P", email: `payee-${Date.now()}@t.test`, passwordHash: "x:y", status: "active" })
      .returning();
    const number = `WEBHOOK-${Date.now()}`;
    const [inv] = await db
      .insert(invoices)
      .values({ clientId: client.id, number, amount: "250.00", status: "sent" })
      .returning();

    const secret = process.env.JWT_SECRET || "visionfold-dev-secret-rotate-in-prod";
    const payload = JSON.stringify({ invoiceNumber: number, status: "paid", providerRef: "ch_test_1" });
    const signature = createHmac("sha256", secret).update(payload).digest("hex");

    // Tampered payload (original signature kept) → rejected.
    const tamperedBody = JSON.stringify({ invoiceNumber: number, status: "paid", amount: "0.01" });
    const badRes = await paymentWebhook(
      new Request("http://localhost/api/webhooks/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-VF-Pay-Signature": `sha256=${signature}` },
        body: tamperedBody,
      })
    );
    expect(badRes.status).toBe(401);

    // Valid call → paid.
    const goodRes = await paymentWebhook(
      new Request("http://localhost/api/webhooks/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-VF-Pay-Signature": `sha256=${signature}` },
        body: payload,
      })
    );
    const goodJson: any = await goodRes.json();
    expect(goodJson.paid).toBe(true);

    const [after] = await db.select().from(invoices).where(eq(invoices.id, inv.id)).limit(1);
    expect(after.status).toBe("paid");

    // Replay with same signature → acknowledged as duplicate, no double effects.
    const replay = await paymentWebhook(
      new Request("http://localhost/api/webhooks/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-VF-Pay-Signature": `sha256=${signature}` },
        body: payload,
      })
    );
    const replayJson: any = await replay.json();
    expect(replayJson.duplicate).toBe(true);
  });
});

describe("lead conversion is all-or-nothing", () => {
  it("creates client + project and marks the lead won in one flow", async () => {
    await loginAsAdmin();
    const [lead] = await db
      .insert(leads)
      .values({ name: "Conv C", email: `conv-${Date.now()}@t.test`, service: "Brand Film", budget: "$2,000", message: "Launch film please" })
      .returning();

    const res = await adminPost(jsonReq(`http://localhost/api/admin/leads/${lead.id}/convert`, {}), {
      params: Promise.resolve({ slug: ["leads", String(lead.id), "convert"] }),
    });
    const json: any = await res.json();
    expect(res.status).toBe(200);
    expect(json.clientId).toBeGreaterThan(0);
    expect(json.projectId).toBeGreaterThan(0);
    expect(json.tempPassword).toMatch(/^vf_/);

    const [wonLead] = await db.select().from(leads).where(eq(leads.id, lead.id)).limit(1);
    expect(wonLead.status).toBe("won");
  });
});
