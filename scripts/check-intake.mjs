#!/usr/bin/env node
/**
 * Intake gate tests. A brief that passes validation must be one an editor can
 * actually start from — that is the whole point of the gate.
 *
 * Usage: npx tsx scripts/check-intake.mjs
 */
import { BRIEF_FIELDS, validateBrief, formatBrief, briefSummary } from "../src/lib/intake";

const failures = [];
const check = (label, ok) => {
  if (!ok) failures.push(label);
};

const NOW = new Date("2026-03-15T12:00:00Z");
const iso = (d) => new Date(NOW.getTime() + d * 86400000).toISOString().slice(0, 10);

const complete = {
  title: "Spring campaign film",
  service: "Brand film",
  deadline: iso(21),
  footageUrl: "https://drive.google.com/folder/abc",
  runtime: "1–3 minutes",
  aspectRatios: ["16:9 landscape"],
  captions: "Burned-in captions",
  music: "You choose a licensed track",
  brandKit: "https://brand.example.com/kit",
  references: "https://vimeo.com/123",
};

let v = validateBrief(complete, NOW);
check("complete brief passes", v.complete);
check("complete brief is 100%", v.completeness === 100);
check("complete brief has no missing", v.missing.length === 0);

// Every required field must independently block submission.
for (const field of BRIEF_FIELDS.filter((f) => f.required)) {
  const partial = { ...complete };
  delete partial[field.id];
  const result = validateBrief(partial, NOW);
  check(`missing '${field.id}' blocks submission`, !result.complete);
  check(`missing '${field.id}' is reported`, result.missing.some((m) => m.id === field.id));
}

// Optional fields must never block.
for (const field of BRIEF_FIELDS.filter((f) => !f.required)) {
  const partial = { ...complete };
  delete partial[field.id];
  check(`optional '${field.id}' does not block`, validateBrief(partial, NOW).complete);
}

// Empty strings and whitespace are not answers.
check("empty string counts as missing", !validateBrief({ ...complete, footageUrl: "" }, NOW).complete);
check("whitespace counts as missing", !validateBrief({ ...complete, title: "   " }, NOW).complete);
check("empty array counts as missing", !validateBrief({ ...complete, aspectRatios: [] }, NOW).complete);

// Quality warnings — filled in, but not usable.
check(
  "bad footage URL warns",
  validateBrief({ ...complete, footageUrl: "its on my desktop" }, NOW).warnings.some((w) => /footage link/i.test(w))
);
check(
  "past deadline warns",
  validateBrief({ ...complete, deadline: iso(-3) }, NOW).warnings.some((w) => /past/i.test(w))
);
check(
  "rush deadline warns",
  validateBrief({ ...complete, deadline: iso(1) }, NOW).warnings.some((w) => /rush/i.test(w))
);
check(
  "unreadable deadline warns",
  validateBrief({ ...complete, deadline: "next monday" }, NOW).warnings.some((w) => /date/i.test(w))
);
check(
  "missing brand kit warns but allows",
  (() => {
    const r = validateBrief({ ...complete, brandKit: "" }, NOW);
    return r.complete && r.warnings.some((w) => /brand kit/i.test(w));
  })()
);
check(
  "many formats warns",
  validateBrief({ ...complete, aspectRatios: ["16:9 landscape", "9:16 vertical", "1:1 square"] }, NOW).warnings.some(
    (w) => /reframing/i.test(w)
  )
);
check("a good brief has no scary warnings", !validateBrief(complete, NOW).warnings.some((w) => /past|isn't a URL/i.test(w)));

// Partial completeness is proportional and never out of range.
const empty = validateBrief({}, NOW);
check("empty brief is 0%", empty.completeness === 0);
check("empty brief lists every required field", empty.missing.length === BRIEF_FIELDS.filter((f) => f.required).length);
const half = validateBrief({ title: "x", service: "Brand film", deadline: iso(10) }, NOW);
check("partial completeness is between", half.completeness > 0 && half.completeness < 100);

// Formatting for the studio side.
const formatted = formatBrief(complete);
check("formatted brief includes the deadline", formatted.includes("When do you need it?"));
check("formatted brief includes footage link", formatted.includes("drive.google.com"));
check("formatted brief joins multiselects", formatBrief({ aspectRatios: ["16:9 landscape", "9:16 vertical"] }).includes("16:9 landscape, 9:16 vertical"));
check("formatted brief omits the title", !formatted.includes("Project name:"));
check("formatted brief skips blanks", !formatBrief({ title: "x", notes: "" }).includes("Anything else"));
check("summary is one line", !briefSummary(complete).includes("\n") && briefSummary(complete).includes("Brand film"));

// Junk must not throw.
check(
  "junk input survives",
  (() => {
    try {
      validateBrief({ aspectRatios: "not-an-array", deadline: 12345 }, NOW);
      return true;
    } catch {
      return false;
    }
  })()
);

if (failures.length) {
  console.error(`✗ ${failures.length} intake assertion(s) failed:`);
  failures.forEach((f) => console.error(`  · ${f}`));
  process.exit(1);
}
console.log(`✓ intake gate: ${BRIEF_FIELDS.length} fields — required/optional split, quality warnings and formatting all hold`);
