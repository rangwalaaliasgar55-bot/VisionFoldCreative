/**
 * Client-facing status announcements.
 *
 * "Any update?" is the most expensive message a studio receives ΓÇö it costs a
 * context switch to answer and it means the client felt uninformed. Every stage
 * change now writes to the project timeline and the client's thread, in plain
 * language, automatically.
 *
 * Pure module so the copy can be tested: no half-finished templates, no
 * duplicate announcements, no internal jargon leaking to clients.
 */

export type Announcement = { title: string; body: string };

/** Stage copy. Written for the client, never using internal status strings. */
const STAGE_COPY: Record<string, (title: string) => Announcement> = {
  intake: (t) => ({
    title: "Brief received",
    body: `We've got everything for ΓÇ£${t}ΓÇ¥ and it's queued with the team. We'll confirm the schedule shortly.`,
  }),
  in_progress: (t) => ({
    title: "Editing started",
    body: `ΓÇ£${t}ΓÇ¥ is on the timeline now. The first pass is a story edit ΓÇö pacing and structure before any polish. We'll share it as soon as it's honest enough to react to.`,
  }),
  in_review: (t) => ({
    title: "Ready for your review",
    body: `The cut of ΓÇ£${t}ΓÇ¥ is ready for you. Watch it end to end, then approve it or leave your notes in the portal ΓÇö timestamped comments are the fastest way for us to act on them.`,
  }),
  revisions: (t) => ({
    title: "Working through your notes",
    body: `We're applying your notes on ΓÇ£${t}ΓÇ¥. You'll get the updated cut back with each point addressed.`,
  }),
  delivered: (t) => ({
    title: "Files delivered",
    body: `ΓÇ£${t}ΓÇ¥ is delivered ΓÇö every format from your brief is in the portal. Grab them any time; they stay available in your account.`,
  }),
  completed: (t) => ({
    title: "Project complete",
    body: `That's ΓÇ£${t}ΓÇ¥ wrapped. Thanks for trusting us with it. If you need another cut, a resize or a version for a different platform, just ask.`,
  }),
  on_hold: (t) => ({
    title: "Paused",
    body: `ΓÇ£${t}ΓÇ¥ is on hold at your request. Nothing is lost ΓÇö say the word and we'll pick it straight back up.`,
  }),
};

/** Progress milestones worth telling someone about. */
const MILESTONES = [50, 100] as const;

export function statusAnnouncement(status: string, projectTitle: string): Announcement | null {
  const build = STAGE_COPY[status];
  if (!build) return null;
  const title = projectTitle.trim() || "your project";
  return build(title);
}

export function milestoneAnnouncement(
  previousProgress: number,
  nextProgress: number,
  projectTitle: string
): Announcement | null {
  const crossed = MILESTONES.find((m) => previousProgress < m && nextProgress >= m);
  if (!crossed) return null;
  const title = projectTitle.trim() || "your project";
  if (crossed === 100) {
    return {
      title: "Edit finished",
      body: `ΓÇ£${title}ΓÇ¥ is at one hundred percent. Final checks next, then delivery.`,
    };
  }
  return {
    title: "Halfway",
    body: `ΓÇ£${title}ΓÇ¥ is halfway through. Structure is locked; polish is next.`,
  };
}

export type ChangeInput = {
  previous: { status: string; progress: number };
  next: { status?: string; progress?: number };
  projectTitle: string;
};

/**
 * What (if anything) the client should be told about this edit. Returns at most
 * one announcement so a single save never spams the thread.
 */
export function announcementFor({ previous, next, projectTitle }: ChangeInput): Announcement | null {
  const statusChanged = typeof next.status === "string" && next.status !== previous.status;
  if (statusChanged) {
    return statusAnnouncement(next.status as string, projectTitle);
  }
  if (typeof next.progress === "number" && next.progress !== previous.progress) {
    return milestoneAnnouncement(previous.progress, next.progress, projectTitle);
  }
  return null;
}

export const KNOWN_STATUSES = Object.keys(STAGE_COPY);
