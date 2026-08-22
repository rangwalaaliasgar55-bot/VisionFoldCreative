import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { clearCookies, cookieJar } from "../helpers/session";
import { setSessionCookie } from "@/lib/auth";
import { db } from "@/db";
import { approvals, clients, projects } from "@/db/schema";
import { eq } from "drizzle-orm";

import { POST as portalPost } from "@/app/api/portal/[action]/route";

const jsonReq = (url: string, body: unknown) =>
  new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

let clientRow!: typeof clients.$inferSelect;
let projectRow!: typeof projects.$inferSelect;

beforeAll(async () => {
  process.env.JWT_SECRET = "test-secret-for-integration-suite";
});

beforeEach(async () => {
  clearCookies();
  const { hashPassword } = await import("@/lib/auth");
  [clientRow] = await db
    .insert(clients)
    .values({
      name: "Signature Owner",
      email: `sign-${Date.now()}-${Math.random().toString(36).slice(2)}@t.test`,
      passwordHash: hashPassword("password123"),
      status: "active",
    })
    .returning();
  [projectRow] = await db
    .insert(projects)
    .values({
      clientId: clientRow.id,
      title: "Approval Test Film",
      service: "Brand Film",
      status: "in_review",
      progress: 95,
      budget: "1800.00",
    })
    .returning();
  await setSessionCookie({ sub: clientRow.id, role: "client", email: clientRow.email, name: clientRow.name });
});

describe("client project approval (e-signature)", () => {
  it("rejects a signature that doesn't match the account name", async () => {
    const res = await portalPost(
      jsonReq("http://localhost/api/portal/approve-project", { projectId: projectRow.id, signedName: "Someone Else" }),
      { params: Promise.resolve({ action: "approve-project" }) }
    );
    expect(res.status).toBe(400);
    const [still] = await db.select().from(projects).where(eq(projects.id, projectRow.id)).limit(1);
    expect(still.status).not.toBe("completed");
  });

  it("signs, completes the project, and generates the final invoice atomically", async () => {
    const res = await portalPost(
      jsonReq("http://localhost/api/portal/approve-project", {
        projectId: projectRow.id,
        signedName: "signature owner",
        createInvoice: true,
      }),
      { params: Promise.resolve({ action: "approve-project" }) }
    );
    const json: any = await res.json();
    expect(res.status).toBe(200);
    expect(json.invoiceCreated).toBe(true);

    const [proj] = await db.select().from(projects).where(eq(projects.id, projectRow.id)).limit(1);
    expect(proj.status).toBe("completed");
    expect(proj.progress).toBe(100);

    const [approval] = await db.select().from(approvals).where(eq(approvals.projectId, projectRow.id)).limit(1);
    expect(approval.signedName.toLowerCase()).toBe("signature owner");

    // Auto-invoice exists for the project.
    const { invoices } = await import("@/db/schema");
    const inv = await db.select().from(invoices).where(eq(invoices.projectId, projectRow.id)).limit(1);
    expect(Number(inv[0]?.amount)).toBe(1800);
  });

  it("blocks double-approval", async () => {
    await db.insert(approvals).values({ projectId: projectRow.id, clientId: clientRow.id, signedName: "Signature Owner" });
    const res = await portalPost(
      jsonReq("http://localhost/api/portal/approve-project", { projectId: projectRow.id, signedName: "Signature Owner" }),
      { params: Promise.resolve({ action: "approve-project" }) }
    );
    expect(res.status).toBe(400);
  });
});
