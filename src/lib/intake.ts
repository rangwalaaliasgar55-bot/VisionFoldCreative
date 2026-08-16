/**
 * Structured project intake.
 *
 * The questions a video studio otherwise chases over three days of messages:
 * deadline, where the footage actually is, what aspect ratios are needed,
 * whether there are captions, who supplies music. Asking them once, up front,
 * with a completeness gate, is the difference between starting an edit and
 * starting a conversation.
 *
 * Pure module — the portal form, the server validation and the tests all share
 * these definitions, so a field can never be required in one place and optional
 * in another.
 */

export type FieldType = "text" | "textarea" | "url" | "date" | "select" | "multiselect";

export type BriefField = {
  id: string;
  label: string;
  help?: string;
  type: FieldType;
  required: boolean;
  options?: string[];
  placeholder?: string;
};

export const BRIEF_FIELDS: BriefField[] = [
  {
    id: "title",
    label: "Project name",
    type: "text",
    required: true,
    placeholder: "Spring campaign film",
  },
  {
    id: "service",
    label: "What are we making?",
    type: "select",
    required: true,
    options: [
      "Brand film",
      "YouTube edit",
      "Commercial / ad",
      "Music video",
      "Wedding film",
      "Podcast episode",
      "Shorts / Reels",
      "Something else",
    ],
  },
  {
    id: "deadline",
    label: "When do you need it?",
    help: "A real date beats “ASAP” — it tells us how to schedule the passes.",
    type: "date",
    required: true,
  },
  {
    id: "footageUrl",
    label: "Where is the footage?",
    help: "Drive, Dropbox, Frame.io, WeTransfer — any link we can download from.",
    type: "url",
    required: true,
    placeholder: "https://drive.google.com/…",
  },
  {
    id: "runtime",
    label: "Target length",
    type: "select",
    required: true,
    options: ["Under 30 seconds", "30–60 seconds", "1–3 minutes", "3–10 minutes", "Over 10 minutes"],
  },
  {
    id: "aspectRatios",
    label: "Which formats?",
    help: "Pick every place this will be posted — reframing later costs a pass.",
    type: "multiselect",
    required: true,
    options: ["16:9 landscape", "9:16 vertical", "1:1 square", "4:5 portrait"],
  },
  {
    id: "captions",
    label: "Captions",
    type: "select",
    required: true,
    options: ["Burned-in captions", "Separate SRT file", "No captions"],
  },
  {
    id: "music",
    label: "Music",
    type: "select",
    required: true,
    options: ["You choose a licensed track", "We'll supply the track", "No music"],
  },
  {
    id: "brandKit",
    label: "Brand kit or logo pack",
    help: "Optional, but without it we'll use our own type and colour choices.",
    type: "url",
    required: false,
    placeholder: "https://…",
  },
  {
    id: "references",
    label: "References",
    help: "Two or three links to films with the feel you're after.",
    type: "textarea",
    required: false,
  },
  {
    id: "notes",
    label: "Anything else we should know?",
    type: "textarea",
    required: false,
  },
];

export type BriefAnswers = Record<string, string | string[] | undefined>;

export type BriefValidation = {
  complete: boolean;
  completeness: number;
  missing: { id: string; label: string }[];
  warnings: string[];
};

const isFilled = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value.length > 0 : Boolean(value && String(value).trim());

const looksLikeUrl = (value: string) => /^https?:\/\/[^\s]+\.[^\s]+/i.test(value.trim());

export function validateBrief(answers: BriefAnswers, now = new Date()): BriefValidation {
  const missing: { id: string; label: string }[] = [];
  const warnings: string[] = [];

  for (const field of BRIEF_FIELDS) {
    const value = answers[field.id];
    if (field.required && !isFilled(value)) {
      missing.push({ id: field.id, label: field.label });
    }
  }

  // Quality checks — filled in, but not usable.
  const footage = String(answers.footageUrl || "").trim();
  if (footage && !looksLikeUrl(footage)) {
    warnings.push("The footage link doesn't look like a URL we can open.");
  }

  const brandKit = String(answers.brandKit || "").trim();
  if (brandKit && !looksLikeUrl(brandKit)) {
    warnings.push("The brand kit link doesn't look like a URL.");
  }
  if (!brandKit) {
    warnings.push("No brand kit — we'll use our own type and colour choices.");
  }

  const deadline = String(answers.deadline || "").trim();
  if (deadline) {
    const date = new Date(deadline);
    if (Number.isNaN(date.getTime())) {
      warnings.push("That deadline isn't a date we can read.");
    } else {
      const days = Math.floor((date.getTime() - now.getTime()) / 86_400_000);
      if (days < 0) warnings.push("That deadline is in the past.");
      else if (days <= 2) warnings.push("That's a rush turnaround — we'll confirm we can hit it.");
    }
  }

  const ratios = answers.aspectRatios;
  if (Array.isArray(ratios) && ratios.length >= 3) {
    warnings.push("Three or more formats means an extra reframing pass — worth confirming you need them all.");
  }

  if (!isFilled(answers.references)) {
    warnings.push("No references — the first cut will be our read of the brief.");
  }

  const requiredCount = BRIEF_FIELDS.filter((f) => f.required).length;
  const answered = requiredCount - missing.length;

  return {
    complete: missing.length === 0,
    completeness: Math.round((answered / Math.max(requiredCount, 1)) * 100),
    missing,
    warnings,
  };
}

/** A readable brief for the studio side — no JSON blobs in the project record. */
export function formatBrief(answers: BriefAnswers): string {
  const lines: string[] = [];
  for (const field of BRIEF_FIELDS) {
    const value = answers[field.id];
    if (!isFilled(value)) continue;
    if (field.id === "title") continue; // it's the project name already
    const text = Array.isArray(value) ? value.join(", ") : String(value).trim();
    lines.push(`${field.label}: ${text}`);
  }
  return lines.join("\n");
}

/** One-line summary for the timeline entry. */
export function briefSummary(answers: BriefAnswers): string {
  const parts = [
    String(answers.service || "Project"),
    String(answers.runtime || ""),
    Array.isArray(answers.aspectRatios) ? answers.aspectRatios.join(" + ") : "",
    answers.deadline ? `due ${answers.deadline}` : "",
  ].filter(Boolean);
  return parts.join(" · ");
}
