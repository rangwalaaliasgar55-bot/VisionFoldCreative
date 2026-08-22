export type ScoreableLead = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  service?: string | null;
  budget?: string | null;
  message?: string | null;
  notes?: string | null;
  source?: string | null;
};

export type LeadScore = {
  score: number;
  band: "hot" | "warm" | "cold";
  reasons: string[];
};

const VIDEO_FIT = /video|edit|film|reel|short|youtube|ad|commercial|wedding|brand|podcast|colour|color grade/i;

/**
 * Deterministic 0–100 score from real lead fields. No AI, no randomness.
 * Used on create/update and after Maps import so the pipeline sorts itself.
 */
export function scoreLead(lead: ScoreableLead): LeadScore {
  let score = 10;
  const reasons: string[] = [];

  const email = String(lead.email || "").trim();
  const phone = String(lead.phone || "").replace(/[^\d]/g, "");
  const message = String(lead.message || "").trim();
  const budget = String(lead.budget || "").trim();
  const service = String(lead.service || "").trim();
  const source = String(lead.source || "").toLowerCase();
  const name = String(lead.name || "").trim();

  if (name.length > 1) {
    score += 8;
    reasons.push("Named contact");
  }
  if (email.includes("@") && email.includes(".")) {
    score += 12;
    reasons.push("Email on file");
  }
  if (phone.length >= 10) {
    score += 14;
    reasons.push("Phone on file");
  }
  if (message.length > 40) {
    score += 12;
    reasons.push("Detailed brief");
  } else if (message.length > 8) {
    score += 6;
    reasons.push("Short brief");
  }
  if (budget) {
    score += 14;
    reasons.push("Budget signal");
    if (/[1-9]\d{4,}/.test(budget.replace(/,/g, "")) || /lakh|₹|inr|\$/i.test(budget)) {
      score += 6;
      reasons.push("Concrete budget");
    }
  }
  if (VIDEO_FIT.test(`${service} ${message} ${lead.notes || ""}`)) {
    score += 12;
    reasons.push("Video-editing fit");
  }
  if (source === "website" || source === "whatsapp" || source === "referral") {
    score += 10;
    reasons.push(`Inbound · ${source}`);
  } else if (source === "maps" || source === "ai_search") {
    score += 4;
    reasons.push("Outbound prospect");
  }

  score = Math.max(0, Math.min(100, score));
  const band: LeadScore["band"] = score >= 70 ? "hot" : score >= 45 ? "warm" : "cold";
  if (!reasons.length) reasons.push("Incomplete record");
  return { score, band, reasons };
}
