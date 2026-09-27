import { db } from "@/db";
import {
  activity,
  automations,
  categories,
  clients,
  deliverables,
  expenses,
  frameAnnotations,
  invoices,
  leads,
  media,
  messages,
  portfolio,
  posts,
  projects,
  quotas,
  ratings,
  settings,
  updates,
  users,
  webhooks,
} from "@/db/schema";
import { count, eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import { ensureMigrations } from "@/db/migrate";
import { hydrateRuntimeKeys } from "@/lib/runtimeKeys";
import { AI_SUBSCRIPTIONS, TEAM, TOOL_COSTS, TOTAL_REVENUE } from "@/lib/studioOps";

/** Date N months back from today (negative N = future), clamped to a safe day. */
function monthAgo(months: number, day = 12): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - months, Math.min(Math.max(day, 1), 28), 10, 30, 0);
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

let seedPromise: Promise<void> | null = null;

/** Admin credential source of truth (env override, else the studio default). */
export function getAdminCredentials() {
  const email = (process.env.ADMIN_EMAIL || "visionfoldcreative@gmail.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "aliasgar134";
  return { email, password };
}

/**
 * Always ensure the owner account can sign in, regardless of DB state:
 * - creates the admin if missing
 * - upgrades accounts still sitting on the legacy 'demo1234' seed default
 * (runs on every request via ensureSeed — idempotent and cheap)
 */
export async function ensureAdmin() {
  const { email, password } = getAdminCredentials();
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const admin = rows[0];
  if (!admin) {
    await db
      .insert(users)
      .values({ email, name: "Aliasgar Rangwala", passwordHash: hashPassword(password), role: "admin" });
    return;
  }
  if (password !== "demo1234" && verifyPassword("demo1234", admin.passwordHash)) {
    await db
      .update(users)
      .set({ passwordHash: hashPassword(password), name: admin.name || "Aliasgar Rangwala" })
      .where(eq(users.id, admin.id));
  }
}

export async function ensureSeed() {
  if (!seedPromise) {
    // If seeding fails (e.g. DB briefly unreachable), clear the promise so the
    // next request retries instead of being stuck with a rejected promise
    // for the lifetime of this serverless instance.
    seedPromise = runSeed(false);
    seedPromise.catch(() => {
      seedPromise = null;
    });
  }
  await seedPromise;
  await ensureMigrations();
  await hydrateRuntimeKeys();
  await ensureAdmin();
}

export async function resetSeed() {
  await runSeed(true);
}

async function runSeed(force: boolean) {
  try {
    const userCountRes = await db.select({ n: count() }).from(users);
    const hasUsers = (userCountRes[0]?.n ?? 0) > 0;

    if (hasUsers && !force) {
      return;
    }

    if (force) {
      await db.delete(frameAnnotations);
      await db.delete(deliverables);
      await db.delete(messages);
      await db.delete(updates);
      await db.delete(invoices);
      await db.delete(ratings);
      await db.delete(projects);
      await db.delete(clients);
      await db.delete(leads);
      await db.delete(portfolio);
      await db.delete(expenses);
      await db.delete(posts);
      await db.delete(categories);
      await db.delete(media);
      await db.delete(automations);
      await db.delete(activity);
      await db.delete(users);
      await db.delete(settings);
      // quotas must be reset too, otherwise re-seeding leaves two rows and
      // GET/PATCH (which read row #1) use stale limits.
      await db.delete(quotas);
    }

    // 1. Settings
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      await db.insert(settings).values({ key, value, updatedAt: new Date() }).onConflictDoUpdate({
        target: settings.key,
        set: { value, updatedAt: new Date() },
      });
    }

    // 2. Users (Admin) — credentials come from ADMIN_EMAIL / ADMIN_PASSWORD.
    const isProd = process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);
    // Demo people (fake clients/leads/messages/activity) only seed when asked for,
    // or in local development. Production stays clean of placeholder names.
    const seedDemo = process.env.SEED_DEMO === "true" || !isProd;
    const { email: adminEmail, password: adminPassword } = getAdminCredentials();
    if (isProd && !process.env.ADMIN_PASSWORD) {
      console.warn(
        "[seed] WARNING: ADMIN_PASSWORD env var is not set — the default admin password is active. " +
        "Set ADMIN_PASSWORD (and rotate it) in your deployment environment."
      );
    }
    const adminHash = hashPassword(adminPassword);
    // 2b. Staff accounts — Yusuf and Aliasgar are the studio heads, Rahul and
    // Pankaj are the editors on the timeline. Seeded in every environment so
    // /admin/team reflects the real roster.
    const staffPassword = process.env.STAFF_DEFAULT_PASSWORD || "visionfold@2026";
    const staffHash = hashPassword(staffPassword);
    await db.insert(users).values([
      {
        email: adminEmail,
        name: "Aliasgar Rangwala",
        passwordHash: adminHash,
        role: "admin",
      },
      ...TEAM.filter((m) => m.email.toLowerCase() !== adminEmail).map((m) => ({
        email: m.email.toLowerCase(),
        name: m.name,
        passwordHash: staffHash,
        role: m.role,
      })),
    ]);

    // Hoisted ids — referenced by later demo sections (ratings, activity, annotations, deliverables)
    let c1 = 1, c2 = 2, c3 = 3, c4 = 4, c5 = 5, c6 = 6, c7 = 7, c8 = 8, c9 = 9;
    let p1 = 1, p2 = 2, p3 = 3, p4 = 4;

    if (seedDemo) {
    // 3. Clients — 9 active accounts (override password via CLIENT_DEMO_PASSWORD)
    const clientHash = hashPassword(process.env.CLIENT_DEMO_PASSWORD || "demo1234");
    const clientRows = await db
      .insert(clients)
      .values([
        {
          name: "Sarah Jenkins",
          email: "client@visionfold.com",
          phone: "+1 (555) 349-2910",
          company: "Nova Sound Records",
          passwordHash: clientHash,
          status: "active",
          notes: "VIP retainer. Music videos + festival recaps. 14 shorts and 3 long-form delivered.",
        },
        {
          name: "Marcus Vance",
          email: "marcus@lumina.io",
          phone: "+1 (555) 882-1920",
          company: "Lumina Robotics",
          passwordHash: clientHash,
          status: "active",
          notes: "Hardware launch films and tech explainers. 8 shorts + 5 long-form delivered.",
        },
        {
          name: "Elena Rostova",
          email: "elena@velawaves.com",
          phone: "+1 (555) 701-4439",
          company: "Vela Waves Activewear",
          passwordHash: clientHash,
          status: "active",
          notes: "High-volume 9:16 performance ads. 22 shorts delivered, 6 in the queue.",
        },
        {
          name: "Kai Takahashi",
          email: "kai@apexcreators.com",
          phone: "+1 (555) 492-8811",
          company: "Apex Creators YouTube",
          passwordHash: clientHash,
          status: "active",
          notes: "Weekly YouTube series (1.2M subs). 9 long-form episodes + 12 shorts.",
        },
        {
          name: "Ananya Iyer",
          email: "ananya@kesarandco.in",
          phone: "+91 98204 41127",
          company: "Kesar & Co. Jewellery",
          passwordHash: clientHash,
          status: "active",
          notes: "D2C festive campaigns, Mumbai. Monthly retainer — 10 reels/month.",
        },
        {
          name: "Rohit Malhotra",
          email: "rohit@finlyticspodcast.com",
          phone: "+91 99303 87720",
          company: "Finlytics Podcast",
          passwordHash: clientHash,
          status: "active",
          notes: "4 podcast episodes + 20 clipped shorts per month. Auto-subtitled.",
        },
        {
          name: "Zainab Merchant",
          email: "zainab@merchantrealty.in",
          phone: "+91 77250 11884",
          company: "Merchant Realty, Indore",
          passwordHash: clientHash,
          status: "active",
          notes: "Property walkthrough films and broker reels. Local flagship account.",
        },
        {
          name: "Daniel Okoye",
          email: "daniel@grindsetfitness.com",
          phone: "+44 7700 900412",
          company: "GrindSet Fitness",
          passwordHash: clientHash,
          status: "active",
          notes: "Transformation shorts + YouTube long-form. Wants to double volume in Q4.",
        },
        {
          name: "Priya Nair",
          email: "priya@sattvawellness.in",
          phone: "+91 90048 22391",
          company: "Sattva Wellness Studio",
          passwordHash: clientHash,
          status: "active",
          notes: "Calm-aesthetic reels and a yearly brand film. Newest retainer.",
        },
      ])
      .returning();

    c1 = clientRows[0]?.id ?? 1;
    c2 = clientRows[1]?.id ?? 2;
    c3 = clientRows[2]?.id ?? 3;
    c4 = clientRows[3]?.id ?? 4;
    c5 = clientRows[4]?.id ?? 5;
    c6 = clientRows[5]?.id ?? 6;
    c7 = clientRows[6]?.id ?? 7;
    c8 = clientRows[7]?.id ?? 8;
    c9 = clientRows[8]?.id ?? 9;

    // 4. Projects
    const projectRows = await db
      .insert(projects)
      .values([
        {
          clientId: c1,
          title: "Cyberpunk Neon Beat — Official 4K Music Video",
          service: "Music Video",
          description: "4K rhythmic music cut with custom speed ramps, neon glow transitions, 35mm grain, and cinematic halation. Editor: Aliasgar.",
          status: "review",
          progress: 85,
          dueDate: isoDate(monthAgo(-1, 4)),
          budget: "230000.00",
        },
        {
          clientId: c2,
          title: "Lumina Gen-2 AI Robot Launch Film",
          service: "Brand Films",
          description: "60-second cinema spot for hardware launch, multi-cam assembly, sound design, and 3D motion tracking. Editor: Rahul.",
          status: "in_progress",
          progress: 60,
          dueDate: isoDate(monthAgo(-1, 12)),
          budget: "375000.00",
        },
        {
          clientId: c3,
          title: "Summer Drop 2026 — 9:16 Viral Ad Suite",
          service: "Commercials & Ads",
          description: "Pack of 6 high-converting Reels with kinetic typography, hooks, and trending audio mix. Editor: Pankaj.",
          status: "revision",
          progress: 90,
          dueDate: isoDate(monthAgo(0, 30)),
          budget: "135000.00",
        },
        {
          clientId: c4,
          title: "The ₹100Cr AI Economy — Episode 42",
          service: "YouTube Editing",
          description: "22-minute documentary-style YouTube video with dynamic B-roll storytelling, soundscapes, and custom motion charts. Editor: Rahul.",
          status: "completed",
          progress: 100,
          dueDate: isoDate(monthAgo(1, 10)),
          budget: "70000.00",
        },
        {
          clientId: c5,
          title: "Kesar & Co. — Festive Gold Campaign (10 Reels)",
          service: "Commercials & Ads",
          description: "Diwali campaign: 10 vertical reels, macro product beauty shots, gold-warm grade. Editor: Pankaj.",
          status: "in_progress",
          progress: 55,
          dueDate: isoDate(monthAgo(-1, 8)),
          budget: "148000.00",
        },
        {
          clientId: c6,
          title: "Finlytics Podcast — September Pack (4 eps + 20 shorts)",
          service: "Podcast Editing",
          description: "Multi-cam podcast assembly, noise repair, auto-subtitled shorts with hook-first captions. Editors: Rahul + Pankaj.",
          status: "in_progress",
          progress: 70,
          dueDate: isoDate(monthAgo(0, 28)),
          budget: "96000.00",
        },
        {
          clientId: c7,
          title: "Merchant Realty — Sky Residences Walkthrough Film",
          service: "Brand Films",
          description: "4-min cinematic property film plus 6 broker reels shot on gimbal and FPV. Editor: Aliasgar.",
          status: "review",
          progress: 80,
          dueDate: isoDate(monthAgo(0, 26)),
          budget: "84000.00",
        },
        {
          clientId: c8,
          title: "GrindSet — 12 Transformation Shorts + Ep. 07",
          service: "YouTube Editing",
          description: "Retention-first long-form episode with 12 derived shorts. Editor: Pankaj.",
          status: "in_progress",
          progress: 45,
          dueDate: isoDate(monthAgo(-1, 2)),
          budget: "112000.00",
        },
        {
          clientId: c9,
          title: "Sattva Wellness — Brand Film & Calm Reels",
          service: "Brand Films",
          description: "Slow-cinema brand film with ambient sound design plus 8 calm-aesthetic reels. Editor: Aliasgar.",
          status: "intake",
          progress: 15,
          dueDate: isoDate(monthAgo(-2, 6)),
          budget: "126000.00",
        },
        {
          clientId: c1,
          title: "Midnight Tour Aftermovie & Teaser",
          service: "Music Video",
          description: "Festival tour recap with sound design and crowd energy pacing. Editor: Rahul.",
          status: "intake",
          progress: 20,
          dueDate: isoDate(monthAgo(-1, 20)),
          budget: "180000.00",
        },
      ])
      .returning();

    p1 = projectRows[0]?.id ?? 1;
    p2 = projectRows[1]?.id ?? 2;
    p3 = projectRows[2]?.id ?? 3;
    p4 = projectRows[3]?.id ?? 4;

    // 5. Updates
    await db.insert(updates).values([
      {
        projectId: p1,
        title: "Assembly Cut V1 Delivered",
        body: "First cut assembled with initial beat sync and color pass. Ready for client playback.",
      },
      {
        projectId: p1,
        title: "Sound Design & Glitch FX Layered",
        body: "Added risers, cinematic impacts, and audio-reactive glitch flashes to the chorus.",
      },
      {
        projectId: p1,
        title: "V2 Master Render in 4K ProRes Ready",
        body: "Color grading refined to teal/orange palette with 35mm grain. Please test playback in Portal review.",
      },
      {
        projectId: p2,
        title: "Story Beat Sheet Approved",
        body: "Footage ingested from RED V-Raptor 8K. Rough assembly begun by Rahul.",
      },
      {
        projectId: p2,
        title: "3D HUD & Kinetic Text Compositing",
        body: "Composited UI overlays on product closeups.",
      },
      {
        projectId: p3,
        title: "Hook Iterations V1 Delivered",
        body: "Pankaj rendered 3 distinct opening hook variations for A/B testing on Meta & TikTok.",
      },
      {
        projectId: p4,
        title: "Final Master Exported & Delivered",
        body: "Full episode published, thumbnail cutouts and 4 Shorts clips delivered.",
      },
    ]);

    // 6. Messages — inbound demand is outrunning capacity
    await db.insert(messages).values([
      {
        clientId: c1,
        sender: "admin",
        body: "Hey Sarah! We've uploaded the V2 cut of Cyberpunk Neon Beat. Check out the chorus transition at 01:14!",
        read: true,
      },
      {
        clientId: c1,
        sender: "client",
        body: "The pacing on that drop is incredible! Can we push the bass hit audio level by +2dB on the second chorus?",
        read: true,
      },
      {
        clientId: c1,
        sender: "admin",
        body: "Done and re-rendered! The master is ready for final approval in your Portal Review tab.",
        read: false,
      },
      {
        clientId: c2,
        sender: "client",
        body: "Hi VisionFold team, we just uploaded the additional 8K B-roll clips for the robotic arm demo.",
        read: true,
      },
      {
        clientId: c2,
        sender: "admin",
        body: "Ingested! Rahul is cutting them into the assembly today. Preview link tomorrow.",
        read: true,
      },
      {
        clientId: c5,
        sender: "client",
        body: "Aliasgar bhai, can we add 4 more reels to the Diwali pack? Budget is approved on our side.",
        read: false,
      },
      {
        clientId: c6,
        sender: "client",
        body: "Shorts from Ep. 118 did 410K views. Can we move from 20 to 30 shorts a month starting October?",
        read: false,
      },
      {
        clientId: c8,
        sender: "client",
        body: "We want to double output to 24 shorts/month. Do you have the editor bandwidth? Happy to pay a rush retainer.",
        read: false,
      },
      {
        clientId: c9,
        sender: "admin",
        body: "Welcome aboard Priya! Yusuf will run your kickoff call and Aliasgar will own the creative direction.",
        read: true,
      },
    ]);

    // 7. Invoices — collected revenue ledger (₹6,70,320 paid across 6 months)
    const paidLedger: { monthsAgo: number; day: number; clientId: number; projectId: number | null; number: string; amount: number; notes: string }[] = [
      { monthsAgo: 5, day: 9, clientId: c3, projectId: null, number: "VF-2026-041", amount: 24_000, notes: "10 vertical shorts — April performance pack." },
      { monthsAgo: 5, day: 22, clientId: c4, projectId: null, number: "VF-2026-042", amount: 38_400, notes: "2 long-form YouTube episodes + 4 derived shorts." },
      { monthsAgo: 4, day: 7, clientId: c2, projectId: null, number: "VF-2026-047", amount: 42_000, notes: "Brand film re-cut + 3 social edits." },
      { monthsAgo: 4, day: 19, clientId: c5, projectId: null, number: "VF-2026-048", amount: 36_500, notes: "Kesar & Co. monthly reel retainer (10 shorts)." },
      { monthsAgo: 3, day: 6, clientId: c1, projectId: null, number: "VF-2026-053", amount: 55_200, notes: "Music video milestone 1 + tour teaser." },
      { monthsAgo: 3, day: 21, clientId: c6, projectId: null, number: "VF-2026-054", amount: 36_000, notes: "Finlytics: 4 podcast episodes + 20 shorts." },
      { monthsAgo: 2, day: 5, clientId: c7, projectId: null, number: "VF-2026-061", amount: 64_800, notes: "Sky Residences walkthrough film + 6 broker reels." },
      { monthsAgo: 2, day: 18, clientId: c3, projectId: null, number: "VF-2026-062", amount: 47_500, notes: "Vela Waves 9:16 ad suite — 14 shorts." },
      { monthsAgo: 1, day: 4, clientId: c2, projectId: null, number: "VF-2026-070", amount: 72_000, notes: "Lumina Gen-2 launch film — 50% milestone." },
      { monthsAgo: 1, day: 16, clientId: c8, projectId: null, number: "VF-2026-071", amount: 45_920, notes: "GrindSet: Ep. 06 long-form + 12 transformation shorts." },
      { monthsAgo: 1, day: 27, clientId: c9, projectId: null, number: "VF-2026-072", amount: 31_500, notes: "Sattva Wellness onboarding — 8 calm reels." },
      { monthsAgo: 0, day: 3, clientId: c1, projectId: null, number: "VF-2026-080", amount: 88_000, notes: "Cyberpunk Neon Beat 4K master — milestone 2." },
      { monthsAgo: 0, day: 11, clientId: c4, projectId: null, number: "VF-2026-081", amount: 52_500, notes: "Apex Creators: Episode 42 + 8 shorts." },
      { monthsAgo: 0, day: 19, clientId: c6, projectId: null, number: "VF-2026-082", amount: 36_000, notes: "Finlytics September pack — paid on delivery." },
    ];

    const paidTotal = paidLedger.reduce((sum, row) => sum + row.amount, 0);
    if (paidTotal !== TOTAL_REVENUE) {
      console.warn(`[seed] Revenue ledger mismatch: ${paidTotal} vs published ${TOTAL_REVENUE}`);
    }

    await db.insert(invoices).values([
      ...paidLedger.map((row) => ({
        clientId: row.clientId,
        projectId: row.projectId,
        number: row.number,
        amount: row.amount.toFixed(2),
        status: "paid",
        dueDate: isoDate(monthAgo(row.monthsAgo, Math.min(row.day + 7, 28))),
        notes: row.notes,
        createdAt: monthAgo(row.monthsAgo, row.day),
      })),
      // Outstanding (not counted in the ₹6,70,320 collected figure)
      {
        clientId: c5,
        projectId: null,
        number: "VF-2026-083",
        amount: "64000.00",
        status: "sent",
        dueDate: isoDate(monthAgo(-1, 5)),
        notes: "Festive Gold Campaign — balance on delivery of 10 reels.",
        createdAt: monthAgo(0, 22),
      },
      {
        clientId: c8,
        projectId: null,
        number: "VF-2026-084",
        amount: "28500.00",
        status: "sent",
        dueDate: isoDate(monthAgo(-1, 1)),
        notes: "GrindSet Ep. 07 advance — rush turnaround add-on.",
        createdAt: monthAgo(0, 24),
      },
      {
        clientId: c7,
        projectId: null,
        number: "VF-2026-085",
        amount: "19800.00",
        status: "overdue",
        dueDate: isoDate(monthAgo(1, 25)),
        notes: "Broker reels batch 2 — payment reminder sent twice.",
        createdAt: monthAgo(1, 12),
      },
    ]);

    // 7b. Expenses — the ₹1,20,455/month run cost, booked for the last 3 months.
    // Payroll (₹90,000) + AI subscriptions (₹15,480) + tools & studio (₹14,975).
    const expenseRows: { category: string; description: string; amount: string; date: string }[] = [];
    for (const m of [2, 1, 0]) {
      const payDate = isoDate(monthAgo(m, 1));
      for (const member of TEAM) {
        expenseRows.push({
          category: member.head ? "Payroll — Heads" : "Payroll — Editors",
          description: `${member.name} — ${member.title} (monthly)`,
          amount: member.monthlyPay.toFixed(2),
          date: payDate,
        });
      }
      for (const sub of AI_SUBSCRIPTIONS) {
        expenseRows.push({
          category: "AI Subscriptions",
          description: `${sub.name} (${sub.plan}) — ${sub.vendor}`,
          amount: sub.monthlyCost.toFixed(2),
          date: isoDate(monthAgo(m, 3)),
        });
      }
      for (const tool of TOOL_COSTS) {
        expenseRows.push({
          category: tool.category,
          description: tool.name,
          amount: tool.monthlyCost.toFixed(2),
          date: isoDate(monthAgo(m, 5)),
        });
      }
    }
    await db.insert(expenses).values(expenseRows);

    // 8. Leads — inbound demand is far past capacity (34 enquiries in 30 days)
    await db.insert(leads).values([
      {
        name: "David Chen", email: "david@vertexgames.com", phone: "+1 (555) 620-1192",
        service: "Commercials & Ads", budget: "₹2,50,000 - ₹4,00,000",
        message: "We need a cinematic gameplay trailer for our Unreal Engine 5 sci-fi RPG launch.",
        notes: "High potential. Sent preliminary brief questionnaire.", status: "contacted", source: "website", score: 88,
      },
      {
        name: "Amara Okafor", email: "amara@soundscapemedia.co", phone: "+1 (555) 819-4402",
        service: "Music Video", budget: "₹1,60,000 - ₹2,80,000",
        message: "High-fashion Afro-fusion music video in London next month. Rhythmic editing and film color.",
        notes: "Followed up with showreel link.", status: "new", source: "website", score: 74,
      },
      {
        name: "Liam O'Connor", email: "liam@techstackpod.io", phone: "+1 (555) 304-9912",
        service: "Podcast Editing", budget: "₹1,20,000 / month",
        message: "4 full podcast episodes per month plus 20 viral Shorts with burned-in subtitles.",
        notes: "Quote accepted — waiting on an editor slot to free up.", status: "won", source: "referral", score: 92,
      },
      {
        name: "Chloe Dubois", email: "chloe@luxemaison.fr", phone: "+33 6 12 34 56 78",
        service: "Brand Films", budget: "₹5,00,000+",
        message: "Paris Fashion Week recap film and 10 social teasers for a luxury perfume brand.",
        notes: "Call scheduled for Thursday with Yusuf.", status: "contacted", source: "website", score: 95,
      },
      {
        name: "Vikram Deshpande", email: "vikram@nexafintech.in", phone: "+91 98191 22014",
        service: "YouTube Editing", budget: "₹90,000 / month",
        message: "Need 8 long-form finance explainers a month. Can you start next week?",
        notes: "Waitlisted — capacity full until 21 Oct.", status: "new", source: "instagram", score: 81,
      },
      {
        name: "Fatima Sheikh", email: "fatima@bakedbyfatima.in", phone: "+91 88888 40192",
        service: "Commercials & Ads", budget: "₹45,000 / month",
        message: "Cloud kitchen brand — 15 reels a month, food macro shots. Urgent, festive season.",
        notes: "Wants to start immediately. Pankaj is at 94% capacity.", status: "new", source: "whatsapp", score: 69,
      },
      {
        name: "Arjun Kapoor", email: "arjun@hypecartel.co", phone: "+91 90219 77341",
        service: "Commercials & Ads", budget: "₹2,00,000",
        message: "Sneaker drop campaign — 20 shorts in 10 days. Can VisionFold handle the volume?",
        notes: "Rush job — quoted a 25% express surcharge.", status: "contacted", source: "referral", score: 86,
      },
      {
        name: "Meghna Rao", email: "meghna@theslowbrandco.in", phone: "+91 96322 10887",
        service: "Brand Films", budget: "₹3,20,000",
        message: "Founder story film + 12 cutdowns for a sustainable skincare launch.",
        notes: "Sent proposal. Very likely to close.", status: "proposal", source: "website", score: 90,
      },
      {
        name: "Tobias Weber", email: "tobias@northline.de", phone: "+49 151 2345 6789",
        service: "YouTube Editing", budget: "₹1,40,000 / month",
        message: "German automotive channel, 4 long-form + 16 shorts monthly. Need a dedicated editor.",
        notes: "Needs a dedicated editor — hiring gate.", status: "new", source: "youtube", score: 84,
      },
      {
        name: "Sneha Gupta", email: "sneha@auravedaskin.in", phone: "+91 99205 33418",
        service: "Commercials & Ads", budget: "₹60,000 / month",
        message: "Performance creatives for Meta ads — at least 12 hooks a month.",
        notes: "Waitlisted.", status: "new", source: "website", score: 72,
      },
      {
        name: "Imran Qureshi", email: "imran@qspacestudio.in", phone: "+91 76543 22190",
        service: "Wedding Cinema", budget: "₹1,80,000",
        message: "Destination wedding film in Udaipur, 3-camera footage, need a 6-minute cinematic cut.",
        notes: "Peak season — offered a November slot.", status: "contacted", source: "referral", score: 77,
      },
      {
        name: "Grace Wanjiru", email: "grace@safirimedia.co.ke", phone: "+254 712 004 118",
        service: "Brand Films", budget: "₹2,10,000",
        message: "Travel brand docu-series, 3 episodes, cinematic grade and sound design.",
        notes: "Time-zone friendly. Awaiting footage.", status: "proposal", source: "website", score: 79,
      },
      {
        name: "Nikhil Jain", email: "nikhil@stackcrafthq.com", phone: "+91 80107 55283",
        service: "Podcast Editing", budget: "₹75,000 / month",
        message: "SaaS podcast — 8 episodes/month plus clip factory. Referred by Finlytics.",
        notes: "Warm referral from Rohit Malhotra.", status: "new", source: "referral", score: 83,
      },
      {
        name: "Ritika Shah", email: "ritika@glowhouse.in", phone: "+91 98333 71920",
        service: "Commercials & Ads", budget: "₹1,10,000 / month",
        message: "Beauty brand — 18 reels a month. We tried 3 agencies, none can keep the pace.",
        notes: "Would need a 4th editor to service properly.", status: "new", source: "instagram", score: 87,
      },
    ]);

    }

    // 9. Portfolio
    await db.insert(portfolio).values([
      {
        title: "Cyberpunk Neon Odyssey",
        category: "Music Video",
        description: "Rhythm-synced 4K master with custom speed ramps, neon halation, and filmic grain texture.",
        thumbnailUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-cyberpunk-city-at-night-with-neon-lights-42541-large.mp4",
        year: "2026",
        featured: true,
      },
      {
        title: "Lumina: The Future of Automation",
        category: "Brand Film",
        description: "Cinema-grade product launch film with multi-cam pacing, sound design, and 3D UI overlays.",
        thumbnailUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=1200&auto=format&fit=crop",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-robotic-arm-working-in-a-futuristic-factory-42456-large.mp4",
        year: "2026",
        featured: true,
      },
      {
        title: "Apex Horizon — High Altitude Drift",
        category: "Commercials & Ads",
        description: "Dynamic automotive commercial packed with fast sound design, bass drops, and sharp speed curves.",
        thumbnailUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-sports-car-drifting-on-a-road-42617-large.mp4",
        year: "2026",
        featured: true,
      },
      {
        title: "The $100M AI Shift Documentary",
        category: "YouTube Series",
        description: "High-retention documentary editing with animated infographics, historical B-roll, and custom soundscapes.",
        thumbnailUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200&auto=format&fit=crop",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-screens-with-charts-and-data-31912-large.mp4",
        year: "2026",
        featured: true,
      },
      {
        title: "Vela Waves — Coastal Activewear",
        category: "Commercials & Ads",
        description: "Energetic 9:16 vertical cuts designed to capture attention in the first 1.5 seconds.",
        thumbnailUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1200&auto=format&fit=crop",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-young-woman-running-on-the-beach-at-sunset-41484-large.mp4",
        year: "2025",
        featured: false,
      },
      {
        title: "Elysian Romance — Amalfi Coast",
        category: "Wedding Cinema",
        description: "Emotional storytelling with natural warm golden grade and bespoke orchestral score matching.",
        thumbnailUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-bride-and-groom-walking-along-the-coast-42419-large.mp4",
        year: "2025",
        featured: false,
      },
    ]);

    if (seedDemo) {
    // 10. Ratings (demo reviews stay hidden — only real client reviews are public)
    await db.insert(ratings).values([
      {
        clientId: c1,
        projectId: p1,
        stars: 5,
        comment: "The VisionFold team elevated our music video beyond expectations. The sound design and color grading are pure Hollywood quality.",
        visible: false,
      },
      {
        clientId: c2,
        projectId: p2,
        stars: 5,
        comment: "Flawless communication and lightning-fast revision rounds. Our hardware launch film got 1.4M views in the first 48 hours.",
        visible: false,
      },
      {
        clientId: c3,
        projectId: p3,
        stars: 5,
        comment: "The hook pacing and kinetic text generated a 3.8x ROAS on our Meta ad spend. VisionFold is our secret weapon.",
        visible: false,
      },
      {
        clientId: c4,
        projectId: p4,
        stars: 5,
        comment: "Average watch-time on our YouTube channel jumped from 38% to 64% after switching to VisionFold edits. Highly recommend!",
        visible: false,
      },
      {
        clientId: c5,
        stars: 5,
        comment: "Pankaj turned around 10 festive reels in a week and every single one beat our old creatives on CTR.",
        visible: false,
      },
      {
        clientId: c6,
        stars: 5,
        comment: "The clip factory is the reason our podcast grew 4x. Rahul understands where the hook lives.",
        visible: false,
      },
      {
        clientId: c7,
        stars: 5,
        comment: "Aliasgar personally graded our walkthrough film. Two flats sold off the video alone.",
        visible: false,
      },
      {
        clientId: c8,
        stars: 4,
        comment: "Quality is elite. Only ask is more capacity — we want double the shorts per month.",
        visible: false,
      },
      {
        clientId: c9,
        stars: 5,
        comment: "Yusuf scoped the whole brand film in one call. Calm, clear, and the cut felt exactly like us.",
        visible: false,
      },
    ]);

    }

    // 11. Categories & Posts (WordPress Headless CMS)
    const catRows = await db
      .insert(categories)
      .values([
        { name: "Video Editing", slug: "video-editing" },
        { name: "Color Grading", slug: "color-grading" },
        { name: "Workflow & VFX", slug: "workflow-vfx" },
        { name: "Creator Economy", slug: "creator-economy" },
        { name: "Sound Design", slug: "sound-design" },
      ])
      .returning();

    const catEdit = catRows[0]?.id ?? 1;
    const catColor = catRows[1]?.id ?? 2;
    const catVfx = catRows[2]?.id ?? 3;
    const catCreator = catRows[3]?.id ?? 4;

    await db.insert(posts).values([
      {
        title: "How We Cut Retention-First YouTube Videos That Hold 60%+ Watch Time",
        slug: "retention-first-youtube-video-editing-secrets",
        excerpt: "Every second in an edit either adds curiosity or bleeds viewers. Here is the exact frame-budget framework we use for 1M+ channel edits.",
        content: `
# How We Cut Retention-First YouTube Videos That Hold 60%+ Watch Time

The creator economy has changed dramatically. Viewers decide within **1.8 seconds** whether to stay or swipe. In our studio, we edit with what we call the **Curiosity Loop Pipeline**.

## 1. The Rule of the 3-Beat Hook
Never start with an intro splash screen or logo sting. Begin in media res with an unanswered tension beat:
- **Beat 1:** High stakes visual statement
- **Beat 2:** Micro-conflict or paradox
- **Beat 3:** Promise of resolution

## 2. Dynamic Pacing Without Visual Fatigue
Rapid cuts without narrative purpose make viewers exhausted. Instead, modulate your pacing like music:
- Fast kinetic cut in intro (1.2s avg shot duration)
- Deep story valley with ambient soundscapes (3.5s avg shot duration)
- High-intensity climax with rhythmic risers

## 3. Sound Design is 60% of Perceived Quality
Clean dialog, subtractive EQ, sub-bass thumps on key insights, and subtle swooshes make amateur footage feel like a Netflix documentary.
        `,
        status: "published",
        categoryId: catEdit,
        tags: "youtube, editing, retention, pacing, storytelling",
        featuredImage: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=80&w=1200&auto=format&fit=crop",
        seoTitle: "Retention-First YouTube Video Editing Secrets | VisionFold",
        seoDescription: "Learn how VisionFold cuts YouTube series with 60%+ audience retention using curiosity loops, audio design, and dynamic pacing.",
        views: 1420,
        publishedAt: new Date(Date.now() - 5 * 86400_000),
      },
      {
        title: "DaVinci Resolve vs Premiere Pro: The Ultimate Studio Breakdown for 2026",
        slug: "davinci-resolve-vs-premiere-pro-studio-breakdown-2026",
        excerpt: "An unbiased technical breakdown comparing color science, Fusion VFX, playback caching, and collaboration features.",
        content: `
# DaVinci Resolve vs Premiere Pro: The 2026 Studio Breakdown

When handling multi-terabyte 8K RED and ARRI footage, selecting the right post-production backbone dictates your studio margin and turnaround speed.

## Color Science & Node-Based Grading
DaVinci Resolve's 32-bit float YRGB Color Science remains unchallenged. Node trees allow complex qualifiers, power grades, and film halation emulations without generational quality loss.

## Fusion vs After Effects
Fusion's node graph is superior for 3D camera tracking, clean plate paintouts, and green screen extraction. Premiere's dynamic link to After Effects is still faster for 2D vector mograph templates.

## Verdict
For narrative cinema, commercials, and high-end music videos, DaVinci Resolve Studio is our primary timeline.
        `,
        status: "published",
        categoryId: catColor,
        tags: "davinci resolve, premiere pro, color grading, post-production",
        featuredImage: "https://images.unsplash.com/photo-1535016120720-40c646be5580?q=80&w=1200&auto=format&fit=crop",
        seoTitle: "DaVinci Resolve vs Premiere Pro 2026 | VisionFold Studio",
        seoDescription: "Full technical comparison of DaVinci Resolve vs Adobe Premiere Pro for commercial post-production studios.",
        views: 2890,
        publishedAt: new Date(Date.now() - 12 * 86400_000),
      },
      {
        title: "Film Emulation Mastery: Achieving the 35mm Kodak 2383 Aesthetic",
        slug: "film-emulation-mastery-kodak-2383-aesthetic",
        excerpt: "Why digital footage looks sterile and how to recreate subtractive color density, halation, and gate weave realistically.",
        content: `
# Film Emulation Mastery: Achieving the 35mm Kodak 2383 Aesthetic

Modern digital sensors capture razor-sharp, clinical images. To give videos soul and organic weight, we employ physical film response curves.

## The 4 Pillars of Authentic Film Look:
1. **Subtractive Color Density:** As colors saturate, they become darker and richer, rather than blowing out into neon highlights.
2. **True Halation:** Red/orange scatter around high-contrast specular edges caused by light bouncing off the film base.
3. **Film Grain Distribution:** Grain that lives predominantly in the mid-tones and shadows, rather than uniform digital noise.
4. **Highlight Rolloff:** Smooth soft-shoulder compression simulating photochemical negative response.
        `,
        status: "published",
        categoryId: catColor,
        tags: "film look, kodak 2383, color grading, lut, halation",
        featuredImage: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1200&auto=format&fit=crop",
        seoTitle: "Film Emulation Mastery: 35mm Kodak 2383 Look | VisionFold",
        seoDescription: "Step-by-step masterclass on photochemical film emulation, color density, halation, and highlight rolloff.",
        views: 3120,
        publishedAt: new Date(Date.now() - 20 * 86400_000),
      },
      {
        title: "The Creator Video Production Stack: Gear, AI Tools, and Automation",
        slug: "creator-video-production-stack-ai-tools-automation",
        excerpt: "How top creator studios produce 30+ high-retention assets every month using automated ingest, AI transcripts, and frame reviews.",
        content: `
# The Modern Creator Production Stack

Scaling video production from 1 video per week to 30 high-impact assets per month requires a streamlined pipeline.

## Ingest & Auto-Sync
Using automated folder watchers, multi-camera audio tracks are aligned instantly upon upload.

## AI Rough Cuts & Transcripts
Whisper-based transcript generation allows lightning-fast paper edits and beat-sheet selection before firing up NLE timelines.

## Interactive Client Frame Reviews
Eliminate 50-email revision chains. Time-stamped pinpoint feedback keeps the entire team aligned.
        `,
        status: "published",
        categoryId: catCreator,
        tags: "creator tools, automation, workflows, post-production",
        featuredImage: "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?q=80&w=1200&auto=format&fit=crop",
        seoTitle: "The Creator Video Production Stack & Automation | VisionFold",
        seoDescription: "Discover the software, hardware, and automated review systems used by top creator post-production houses.",
        views: 1980,
        publishedAt: new Date(Date.now() - 30 * 86400_000),
      },
    ]);

    // 12. Automations
    await db.insert(automations).values([
      {
        name: "Auto-Ack New Leads",
        trigger: "lead_created",
        description: "Sends immediate confirmation and project questionnaire to new inquiries.",
        enabled: true,
        config: { autoReplyTemplate: "reply_lead", delaySeconds: 0 },
        lastRunAt: new Date(Date.now() - 3600_000),
      },
      {
        name: "Project Progress Milestone Notification",
        trigger: "project_updated",
        description: "Notifies client via portal message & email when progress exceeds 50% or a new cut is uploaded.",
        enabled: true,
        config: { thresholdProgress: 50, notifyChannels: ["portal", "email"] },
        lastRunAt: new Date(Date.now() - 7200_000),
      },
      {
        name: "Overdue Invoice Reminder",
        trigger: "invoice_overdue",
        description: "Auto-pings clients with polite payment reminder 3 days before and on due date.",
        enabled: true,
        config: { advanceDays: 3, reminderFrequencyDays: 5 },
        lastRunAt: new Date(Date.now() - 14400_000),
      },
      {
        name: "Review Request on Completion",
        trigger: "project_completed",
        description: "Prompts client for a 5-star rating & feedback 24 hours after final project delivery.",
        enabled: true,
        config: { delayHours: 24, rewardCoupon: "VISION10" },
        lastRunAt: new Date(Date.now() - 86400_000),
      },
    ]);

    // 13. Media Library
    await db.insert(media).values([
      {
        name: "visionfold-logo-gold-glow.png",
        url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop",
        type: "image",
        size: 245000,
      },
      {
        name: "cinema-lens-flare-anamorphic.jpg",
        url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop",
        type: "image",
        size: 1820000,
      },
      {
        name: "studio-editing-suite-davinci.jpg",
        url: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=80&w=1200&auto=format&fit=crop",
        type: "image",
        size: 2150000,
      },
      {
        name: "showreel-intro-stinger.mp4",
        url: "https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-screens-with-charts-and-data-31912-large.mp4",
        type: "video",
        size: 8900000,
      },
    ]);

    if (seedDemo) {
    // 14. Activity Log
    await db.insert(activity).values([
      { actor: "Aliasgar Rangwala", action: "Exported Render", details: "Rendered 4K ProRes master for Cyberpunk Neon Beat (v2)." },
      { actor: "Pankaj Sahu", action: "Delivery", details: "Delivered 6 vertical shorts for Vela Waves — 22 shorts this month." },
      { actor: "Rahul Verma", action: "Delivery", details: "Delivered Finlytics Ep. 118 long-form (42 min) + 5 clipped shorts." },
      { actor: "System Automation", action: "Lead Processed", details: "Auto-qualified lead from Ritika Shah (GlowHouse) — score 87." },
      { actor: "System Automation", action: "Capacity Alert", details: "Editor capacity at 89% — 23 enquiries moved to the waitlist." },
      { actor: "Sarah Jenkins", action: "Portal Feedback", details: "Added timestamp comment on Cyberpunk Neon Beat at 01:14." },
      { actor: "System", action: "invoice.paid", details: "Invoice VF-2026-082 marked paid (₹36,000)." },
      { actor: "Yusuf Rangwala", action: "Client Onboarded", details: "Sattva Wellness Studio signed — 9th active retainer client." },
      { actor: "System", action: "Subscription Renewed", details: "Claude Team (3 seats) renewed — ₹8,250 booked to AI Subscriptions." },
      { actor: "System", action: "Subscription Usage", details: "SuperGrok at 64% of monthly request allowance (1,930 / 3,000)." },
      { actor: "System", action: "Subscription Usage", details: "OpenAI ChatGPT Business at 65% of token allowance (1.62M / 2.5M)." },
      { actor: "Aliasgar Rangwala", action: "Payroll Run", details: "Monthly payroll released — ₹90,000 across 4 staff." },
    ]);

    }

    // 15. Quotas & Limits
    await db.insert(quotas).values({
      storageUsedBytes: "78400000000",
      storageLimitBytes: "107374182400", // 100 GB
      aiTokensUsed: 186_400,
      aiTokensLimit: 250000,
      renderHoursUsed: "41.5",
      renderHoursLimit: "50.0",
      activeProjectsLimit: 20,
      alertThresholdPercent: 80,
    });

    if (seedDemo) {
    // 16. Frame Annotations
    await db.insert(frameAnnotations).values([
      {
        projectId: p1,
        clientId: c1,
        timestamp: "00:42",
        comment: "Speed ramp here feels slightly rushed — can we extend by 4 frames?",
        author: "Sarah Jenkins",
        resolved: true,
      },
      {
        projectId: p1,
        clientId: c1,
        timestamp: "01:14",
        comment: "The drop impact is insane! Let's boost the sub-bass audio cue here.",
        author: "Sarah Jenkins",
        resolved: false,
      },
      {
        projectId: p2,
        clientId: c2,
        timestamp: "00:18",
        comment: "Please blur the background prototype logo on the workstation table.",
        author: "Marcus Vance",
        resolved: true,
      },
    ]);

    // 17. Project Deliverables
    await db.insert(deliverables).values([
      {
        projectId: p1,
        name: "Cyberpunk_Neon_Beat_Master_4K_ProRes422HQ.mov",
        format: "Apple ProRes 422 HQ",
        resolution: "4K UHD (3840x2160)",
        sizeBytes: "14200000000",
        downloadUrl: "https://assets.mixkit.co/videos/preview/mixkit-cyberpunk-city-at-night-with-neon-lights-42541-large.mp4",
      },
      {
        projectId: p1,
        name: "Cyberpunk_Neon_Beat_Web_H264_1080p.mp4",
        format: "H.264 / AAC",
        resolution: "1080p Full HD (1920x1080)",
        sizeBytes: "850000000",
        downloadUrl: "https://assets.mixkit.co/videos/preview/mixkit-cyberpunk-city-at-night-with-neon-lights-42541-large.mp4",
      },
      {
        projectId: p3,
        name: "SummerDrop_Reel_01_9x16_Vertical.mp4",
        format: "H.264 9:16",
        resolution: "1080x1920 Vertical",
        sizeBytes: "240000000",
        downloadUrl: "https://assets.mixkit.co/videos/preview/mixkit-young-woman-running-on-the-beach-at-sunset-41484-large.mp4",
      },
    ]);

    }

    // 18. Webhooks
    await db.insert(webhooks).values([
      {
        name: "Slack Studio Notifications",
        url: "https://hooks.slack.com/services/T00/B00/XXXXX",
        events: "lead.created,project.completed,invoice.paid",
        secret: "whsec_visionfold_live_01",
        active: true,
        lastTriggeredAt: new Date(Date.now() - 3600_000),
      },
      {
        name: "Make / Zapier Automation Pipeline",
        url: "https://hook.eu1.make.com/custom-webhook-pipeline",
        events: "project.updated,feedback.received",
        secret: "whsec_make_sync_02",
        active: true,
        lastTriggeredAt: new Date(Date.now() - 7200_000),
      },
    ]);

    console.log("[seed] Database successfully seeded with demo dataset!");
  } catch (err) {
    console.error("[seed] Seeding error:", err);
  }
}
