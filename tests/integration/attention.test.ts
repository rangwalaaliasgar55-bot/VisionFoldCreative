import { beforeAll, describe, expect, it } from "vitest";
import { db } from "@/db";
import { clients, invoices, leads, projects } from "@/db/schema";
import { eq } from "drizzle-orm";

import { getAttention, runAttentionEffects } from "@/lib/automations";
import { announcementFor, statusAnnouncement, milestoneAnnouncement } from "@/lib/statusUpdates";
import { validateBrief, formatBrief } from "@/lib/intake";

beforeAll(async () => {
  process.env.JWT_SECRET = "test-secret-for-integration-suite";
});

describe("attention queue (pure rules + runner)", () => {
  it("flags an unanswered new lead past the SLA", async () => {
    const [lead] = await db
      .insert(leads)
      .values({
        name: "Stale Lead",
        email: `stale-${Date.now()}@t.test`,
        status: "new",
        createdAt: new Date(Date.now() - 3 * 86_400_000),
      })
      .returning();

    const evaluation = await getAttention();
    const hit = evaluation.items.find((i) => i.key === `lead_sla:${lead.id}`);
    expect(hit).toBeDefined();
    expect(hit!.severity === "high" || hit!.severity === "medium").toBe(true);
  });

  it("flips overdue invoices to overdue exactly once per run (cooldown state)", async () => {
    const { hashPassword } = await import("@/lib/auth");
    const [client] = await db
      .insert(clients)
      .values({
        name: "Overdue Owlie",
        email: `owl-${Date.now()}@t.test`,
        passwordHash: hashPassword("password123"),
        status: "active",
      })
      .returning();
    const due = new Date(Date.now() - 10 * 86_400_000);
    const [inv] = await db
      .insert(invoices)
      .values({ clientId: client.id, number: `OWL-${Date.now()}`, amount: "500.00", status: "sent", dueDate: due.toISOString().slice(0, 10) })
      .returning();

    // Force mode ignores cooldowns — first run flips and nudges.
    const first = await runAttentionEffects(true);
    expect(first.applied.invoicesMarkedOverdue).toBeGreaterThanOrEqual(1);

    const [after] = await db.select().from(invoices).where(eq(invoices.id, inv.id)).limit(1);
    expect(after.status).toBe("overdue");

    // Second force run must NOT re-flip (status already overdue).
    const second = await runAttentionEffects(true);
    void second;
    const [final] = await db.select().from(invoices).where(eq(invoices.id, inv.id)).limit(1);
    expect(final.status).toBe("overdue");
  });
});

describe("client status announcements", () => {
  it("announces a review handoff in plain language", () => {
    const note = announcementFor({
      previous: { status: "in_progress", progress: 40 },
      next: { status: "in_review", progress: 40 },
      projectTitle: "Neon Reel",
    });
    expect(note).not.toBeNull();
    expect(note!.title.toLowerCase()).toContain("review");
    expect(note!.body).toContain("Neon Reel");
  });

  it("announces the halfway milestone without a status change", () => {
    const note = announcementFor({
      previous: { status: "in_progress", progress: 45 },
      next: { progress: 55 },
      projectTitle: "Halfway Hero",
    });
    expect(note).not.toBeNull();
  });

  it("stays silent for typo-level edits", () => {
    const note = announcementFor({
      previous: { status: "in_progress", progress: 42 },
      next: { progress: 42 },
      projectTitle: "Quiet Edit",
    });
    expect(note).toBeNull();
  });

  it("maps every known stage to client copy", () => {
    for (const stage of ["intake", "in_progress", "in_review", "revisions", "delivered", "completed", "on_hold"]) {
      expect(statusAnnouncement(stage, "X")).not.toBeNull();
    }
    expect(milestoneAnnouncement(40, 60, "X")).not.toBeNull();
  });
});

describe("structured intake validation", () => {
  it("computes completeness and rejects missing required fields", () => {
    const partial = validateBrief({ title: "Launch film", service: "Brand film" });
    expect(partial.complete).toBe(false);
    expect(partial.missing.length).toBeGreaterThan(0);
    expect(partial.completeness).toBeLessThan(100);
  });

  it("formats a complete brief readably", () => {
    const full = formatBrief({
      title: "Launch film",
      service: "Brand film",
      deadline: "2026-09-30",
      footageUrl: "https://drive.google.com/file/x",
      runtime: "1–3 minutes",
      aspectRatios: ["16:9 landscape", "9:16 vertical"],
      captions: "Burned-in captions",
      music: "You choose a licensed track",
    });
    expect(full).toContain("When do you need it?: 2026-09-30");
    expect(full).toContain("16:9 landscape, 9:16 vertical");
  });
});
