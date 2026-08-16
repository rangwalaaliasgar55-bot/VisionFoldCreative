#!/usr/bin/env node
/**
 * Client announcement tests. This copy goes straight to a paying client with no
 * human in the loop, so it gets checked like production copy.
 *
 * Usage: npx tsx scripts/check-status-updates.mjs
 */
import {
  KNOWN_STATUSES,
  announcementFor,
  milestoneAnnouncement,
  statusAnnouncement,
} from "../src/lib/statusUpdates";

const failures = [];
const check = (label, ok) => {
  if (!ok) failures.push(label);
};

// Every stage must have copy, and it must be client-safe.
for (const status of KNOWN_STATUSES) {
  const a = statusAnnouncement(status, "Spring Film");
  check(`${status}: has copy`, Boolean(a && a.title && a.body));
  check(`${status}: names the project`, a.body.includes("Spring Film"));
  check(`${status}: no unresolved template`, !/\{|\}|\$\{|undefined|null/.test(a.title + a.body));
  check(`${status}: no internal jargon leaks`, !/in_progress|in_review|on_hold/.test(a.body));
  check(`${status}: is a real sentence`, a.body.length > 40 && /[.!]$/.test(a.body.trim()));
}

check("unknown status is silent", statusAnnouncement("banana", "X") === null);
check("blank title falls back", statusAnnouncement("in_review", "   ").body.includes("your project"));

// One save must never produce two messages, and no-ops must stay silent.
const base = { previous: { status: "in_progress", progress: 40 }, projectTitle: "Spring Film" };
check("status change announces", announcementFor({ ...base, next: { status: "in_review" } }) !== null);
check("same status is silent", announcementFor({ ...base, next: { status: "in_progress" } }) === null);
check("unrelated edit is silent", announcementFor({ ...base, next: {} }) === null);
check(
  "status wins over progress (one message only)",
  announcementFor({ ...base, next: { status: "in_review", progress: 55 } }).title === "Ready for your review"
);

// Milestones fire once, on crossing.
check("crossing 50 announces", milestoneAnnouncement(40, 55, "X") !== null);
check("already past 50 is silent", milestoneAnnouncement(55, 60, "X") === null);
check("crossing 100 announces", milestoneAnnouncement(90, 100, "X").title === "Edit finished");
check("small moves are silent", milestoneAnnouncement(10, 20, "X") === null);
check("backwards progress is silent", milestoneAnnouncement(80, 20, "X") === null);
check("progress-only change can announce", announcementFor({ ...base, next: { progress: 100 } }) !== null);

// Tone: no marketing sludge in a client's inbox.
const allCopy = KNOWN_STATUSES.map((s) => statusAnnouncement(s, "X").body).join(" ").toLowerCase();
["synergy", "leverage", "circle back", "as per", "kindly", "dear valued"].forEach((phrase) =>
  check(`no corporate filler: ${phrase}`, !allCopy.includes(phrase))
);

if (failures.length) {
  console.error(`✗ ${failures.length} status announcement assertion(s) failed:`);
  failures.forEach((f) => console.error(`  · ${f}`));
  process.exit(1);
}
console.log(`✓ status announcements: ${KNOWN_STATUSES.length} stages, milestone gating and de-duplication all hold`);
