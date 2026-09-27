/**
 * VisionFold studio operating numbers — one source of truth.
 *
 * Everything the dashboard, the subscriptions page, the public stats band and
 * the database seed show about revenue, delivery volume, payroll and AI
 * subscriptions is derived from the constants in this file, so the figures can
 * never drift apart between screens.
 *
 * Headline figures (FY 2026, trailing 6 months):
 *   • ₹6,70,320 collected revenue
 *   • 128 videos delivered (92 shorts + 36 long-form)
 *   • 9 active retainer clients
 *   • ₹1,20,455 monthly run cost (payroll + AI + tools + studio)
 */

export const CURRENCY = "INR" as const;

/* ------------------------------------------------------------------ *
 * Delivery volume
 * ------------------------------------------------------------------ */

export type DeliveryMonth = { monthsAgo: number; shorts: number; longForm: number };

/** Shorts / long-form delivered per month for the trailing 6 months. */
export const DELIVERY_LEDGER: DeliveryMonth[] = [
  { monthsAgo: 5, shorts: 10, longForm: 4 },
  { monthsAgo: 4, shorts: 12, longForm: 5 },
  { monthsAgo: 3, shorts: 14, longForm: 6 },
  { monthsAgo: 2, shorts: 16, longForm: 6 },
  { monthsAgo: 1, shorts: 18, longForm: 7 },
  { monthsAgo: 0, shorts: 22, longForm: 8 },
];

export const SHORTS_DELIVERED = DELIVERY_LEDGER.reduce((s, m) => s + m.shorts, 0); // 92
export const LONGFORM_DELIVERED = DELIVERY_LEDGER.reduce((s, m) => s + m.longForm, 0); // 36
export const VIDEOS_DELIVERED = SHORTS_DELIVERED + LONGFORM_DELIVERED; // 128

export const ACTIVE_CLIENTS = 9;

/* ------------------------------------------------------------------ *
 * Revenue
 * ------------------------------------------------------------------ */

/** Collected (paid) revenue per month, oldest → newest. Sums to ₹6,70,320. */
export const REVENUE_BY_MONTH: { monthsAgo: number; amount: number }[] = [
  { monthsAgo: 5, amount: 62_400 },
  { monthsAgo: 4, amount: 78_500 },
  { monthsAgo: 3, amount: 91_200 },
  { monthsAgo: 2, amount: 112_300 },
  { monthsAgo: 1, amount: 149_420 },
  { monthsAgo: 0, amount: 176_500 },
];

export const TOTAL_REVENUE = REVENUE_BY_MONTH.reduce((s, m) => s + m.amount, 0); // 670320

/* ------------------------------------------------------------------ *
 * Team — Yusuf & Aliasgar run the studio, three editors on the timeline
 * ------------------------------------------------------------------ */

export type StaffRoleKey = "admin" | "editor" | "accountant";

export type TeamMember = {
  name: string;
  email: string;
  title: string;
  role: StaffRoleKey;
  /** true for the two studio heads */
  head?: boolean;
  /** monthly pay in ₹ */
  monthlyPay: number;
  focus: string;
  /** videos this person cut in the trailing 6 months */
  cutsDelivered: number;
  capacityPercent: number;
};

export const TEAM: TeamMember[] = [
  {
    name: "Yusuf Rangwala",
    email: "yusuf@visionfoldcreative.com",
    title: "Founder & Studio Head",
    role: "admin",
    head: true,
    monthlyPay: 30_000,
    focus: "Client relationships, pricing, final cut approvals, studio P&L.",
    cutsDelivered: 24,
    capacityPercent: 82,
  },
  {
    name: "Aliasgar Rangwala",
    email: "visionfoldcreative@gmail.com",
    title: "Co-Founder & Head of Post",
    role: "admin",
    head: true,
    monthlyPay: 30_000,
    focus: "Creative direction, grade & sound pass, editor reviews, AI pipeline.",
    cutsDelivered: 38,
    capacityPercent: 91,
  },
  {
    name: "Rahul Verma",
    email: "rahul@visionfoldcreative.com",
    title: "Senior Video Editor — Long-form",
    role: "editor",
    monthlyPay: 15_000,
    focus: "YouTube documentaries, podcast episodes, brand films.",
    cutsDelivered: 33,
    capacityPercent: 88,
  },
  {
    name: "Pankaj Sahu",
    email: "pankaj@visionfoldcreative.com",
    title: "Video Editor — Shorts & Reels",
    role: "editor",
    monthlyPay: 15_000,
    focus: "9:16 shorts, hooks, subtitles, ad variants, fast turnarounds.",
    cutsDelivered: 33,
    capacityPercent: 94,
  },
];

export const HEADS = TEAM.filter((m) => m.head);
export const EDITORS = TEAM.filter((m) => !m.head);
export const PAYROLL_MONTHLY = TEAM.reduce((s, m) => s + m.monthlyPay, 0); // 90000

/* ------------------------------------------------------------------ *
 * AI subscriptions + usage
 * ------------------------------------------------------------------ */

export type Subscription = {
  id: string;
  name: string;
  vendor: string;
  plan: string;
  /** monthly cost in ₹ */
  monthlyCost: number;
  seats: number;
  seatsUsed: number;
  renewsOn: string;
  /** primary metered unit this month */
  usage: { used: number; limit: number; unit: string };
  /** secondary counter, e.g. prompts / renders */
  runs: { used: number; label: string };
  usedBy: string[];
  purpose: string;
};

/** AI tooling the studio actually runs on. */
export const AI_SUBSCRIPTIONS: Subscription[] = [
  {
    id: "claude-team",
    name: "Claude Team",
    vendor: "Anthropic",
    plan: "Team · 3 seats",
    monthlyCost: 8_250,
    seats: 3,
    seatsUsed: 3,
    renewsOn: "2026-10-08",
    usage: { used: 2_840_000, limit: 4_500_000, unit: "tokens" },
    runs: { used: 1_248, label: "prompts this month" },
    usedBy: ["Aliasgar Rangwala", "Rahul Verma", "Yusuf Rangwala"],
    purpose: "Script beat sheets, client replies, SEO briefs, proposal drafts.",
  },
  {
    id: "supergrok",
    name: "SuperGrok",
    vendor: "xAI",
    plan: "SuperGrok · 1 seat",
    monthlyCost: 2_650,
    seats: 1,
    seatsUsed: 1,
    renewsOn: "2026-10-14",
    usage: { used: 1_930, limit: 3_000, unit: "requests" },
    runs: { used: 412, label: "trend lookups this month" },
    usedBy: ["Pankaj Sahu"],
    purpose: "Real-time trend + audio research for shorts hooks and thumbnails.",
  },
  {
    id: "openai",
    name: "OpenAI",
    vendor: "OpenAI",
    plan: "ChatGPT Business · 2 seats + API",
    monthlyCost: 4_580,
    seats: 2,
    seatsUsed: 2,
    renewsOn: "2026-10-03",
    usage: { used: 1_620_000, limit: 2_500_000, unit: "tokens" },
    runs: { used: 967, label: "API calls this month" },
    usedBy: ["Aliasgar Rangwala", "Pankaj Sahu"],
    purpose: "Whisper transcripts, subtitle cleanup, ad copy and caption variants.",
  },
];

export const AI_MONTHLY = AI_SUBSCRIPTIONS.reduce((s, x) => s + x.monthlyCost, 0); // 15480

/* ------------------------------------------------------------------ *
 * Creative tools + studio overheads
 * ------------------------------------------------------------------ */

export type ToolCost = { name: string; category: string; monthlyCost: number; note: string };

export const TOOL_COSTS: ToolCost[] = [
  {
    name: "Adobe Creative Cloud — All Apps (2 seats)",
    category: "Software",
    monthlyCost: 4_230,
    note: "Premiere Pro + After Effects for Rahul and Pankaj.",
  },
  {
    name: "Epidemic Sound + Envato Elements",
    category: "Audio",
    monthlyCost: 1_999,
    note: "Commercial music, SFX and motion template licences.",
  },
  {
    name: "Frame.io + NAS cloud backup",
    category: "Infrastructure",
    monthlyCost: 1_499,
    note: "Client review links and 4 TB offsite project backup.",
  },
  {
    name: "Motion Array + plugin renewals",
    category: "Software",
    monthlyCost: 2_247,
    note: "Boris FX, Magic Bullet and transition packs.",
  },
  {
    name: "Studio rent share, power & 300 Mbps fibre",
    category: "Studio",
    monthlyCost: 5_000,
    note: "Indore edit suite — desk share, electricity and internet.",
  },
];

export const TOOLS_MONTHLY = TOOL_COSTS.reduce((s, x) => s + x.monthlyCost, 0); // 14975

/* ------------------------------------------------------------------ *
 * Burn
 * ------------------------------------------------------------------ */

/** Total monthly run cost: payroll + AI subscriptions + tools + studio. */
export const MONTHLY_BURN = PAYROLL_MONTHLY + AI_MONTHLY + TOOLS_MONTHLY; // 120455

/** Published headline burn — the two must match; guarded below. */
export const MONTHLY_BURN_TARGET = 120_455;

if (MONTHLY_BURN !== MONTHLY_BURN_TARGET) {
  // Fail loudly in dev if someone edits a line item without rebalancing.
  console.warn(
    `[studioOps] Monthly burn drifted: computed ₹${MONTHLY_BURN} vs published ₹${MONTHLY_BURN_TARGET}`
  );
}

export const BURN_BREAKDOWN = [
  { label: "Editors & heads (payroll)", value: PAYROLL_MONTHLY },
  { label: "AI subscriptions", value: AI_MONTHLY },
  { label: "Creative tools & infra", value: TOOLS_MONTHLY - 5_000 },
  { label: "Studio, power & internet", value: 5_000 },
];

/* ------------------------------------------------------------------ *
 * Demand signal — inbound is running hotter than capacity
 * ------------------------------------------------------------------ */

export const DEMAND = {
  /** inbound enquiries in the last 30 days */
  inbound30d: 34,
  /** how many we can realistically onboard at current capacity */
  capacitySlots: 11,
  waitlisted: 23,
  avgResponseHours: 3,
  /** % of editor hours already committed */
  bookedPercent: 89,
  nextFreeSlot: "2026-10-21",
};

/** ₹ formatted the Indian way, e.g. ₹6,70,320 */
export function inr(value: number): string {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}
