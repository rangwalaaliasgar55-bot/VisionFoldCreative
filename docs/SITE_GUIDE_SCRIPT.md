# Site guide character — script & production brief

A narrated character that explains the site to first-time visitors. This document
is the **script**, plus the reasoning behind every beat, plus the production
specs so the finished video drops straight into the repo.

---

## 1. What has to be explained, and why

Ranked by what actually loses a visitor. A guide that lists features is noise; a
guide that answers objections in the order people have them converts.

| # | What | Why it must be said | Cost of leaving it out |
| --- | --- | --- | --- |
| 1 | **What this place is**, in one sentence | People decide whether to stay in about three seconds. "Video editing studio" has to land before anything clever. | Bounce before the hero animation finishes |
| 2 | **Proof, immediately** — the reel and real client work | Buyers discount adjectives and trust evidence. Showing beats claiming. | Reads as a template site with stock copy |
| 3 | **What we actually make** — brand films, YouTube, music, weddings, podcasts | Visitors self-identify. A couple planning a wedding and a SaaS marketer need to see themselves. | Wrong-fit enquiries, right-fit visitors leave |
| 4 | **How a project runs** — four passes, first cut in three to five days, approval at each stage | The number one anxiety in post-production isn't quality, it's *"will this drag on and will I get changes?"* | Hesitation, "let me think about it", no brief |
| 5 | **Money** — quote builder, real number in twenty four hours, no hidden fees | The single biggest silent objection. Sites that hide pricing lose people who assume they can't afford it. | Visitor leaves to price a competitor |
| 6 | **How we work together** — client portal, review links, every format | This is the difference between a studio and a freelancer, and it's invisible unless said. | Perceived as a one-person gig |
| 7 | **One next action** — send a brief, no calls required, reply within a day | One CTA converts; three CTAs paralyse. "No calls required" removes the dread of a sales call. | Visitor enjoys the site and does nothing |

**Deliberately left out:** the team's life story, the software list, the 3D
background, and anything about the studio's own opinions on cinema. None of it
moves a visitor toward a brief.

---

## 2. Master script — 60 seconds (~150 words)

Written for a character to speak. Short sentences, one idea each, numbers spelled
out so text-to-speech doesn't say "twenty-four hours" as "twenty four hours"
oddly. No ampersands, no bracketed asides, no words that force a breath mid-line.

| Time | Voice-over | On screen | Beat |
| --- | --- | --- | --- |
| 0:00–0:05 | "Hey. Give me thirty seconds and you'll know if we're a fit." | Guide appears, hero behind | Permission + time cost |
| 0:05–0:12 | "This is VisionFold. We're a video editing studio. Your footage comes in. Finished films go out." | Hero headline | What this is |
| 0:12–0:22 | "Scroll a little and you'll hit the reel. That's real client work. Brand films, YouTube series, music videos, weddings. Play one. It says more than I can." | Scrolls to the 3D reel | Proof |
| 0:22–0:34 | "Here's how a project runs. Four passes. We watch your footage and agree the story first. You get an honest first cut in three to five days. Then polish. Motion graphics, sound, colour." | Scrolls to Process | De-risk timeline |
| 0:34–0:40 | "You approve every stage. Nothing lands as a surprise at the end." | Process cards | De-risk revisions |
| 0:40–0:50 | "Pricing is not a mystery. Use the quote builder. Tell it what you need and we send a real number back within twenty four hours. No hidden fees." | Scrolls to quote builder | Kill the money objection |
| 0:50–0:56 | "While we cut, you live in the client portal. Review links, comments, every format you need." | Portal link highlight | Studio, not freelancer |
| 0:56–1:00 | "When you're ready, send a brief. No calls required. We reply within a day." | CTA button pulses | One action |

### Clean read (no table — copy this into your tool)

> Hey. Give me thirty seconds and you'll know if we're a fit.
>
> This is VisionFold. We're a video editing studio. Your footage comes in. Finished films go out.
>
> Scroll a little and you'll hit the reel. That's real client work. Brand films, YouTube series, music videos, weddings. Play one. It says more than I can.
>
> Here's how a project runs. Four passes. We watch your footage and agree the story first. You get an honest first cut in three to five days. Then polish. Motion graphics, sound, colour.
>
> You approve every stage. Nothing lands as a surprise at the end.
>
> Pricing is not a mystery. Use the quote builder. Tell it what you need and we send a real number back within twenty four hours. No hidden fees.
>
> While we cut, you live in the client portal. Review links, comments, every format you need.
>
> When you're ready, send a brief. No calls required. We reply within a day.

---

## 3. Thirty-second cut (~75 words)

For repeat visitors, mobile, or as the default if the sixty is too long.

> Hey. Thirty seconds, then you can get back to it.
>
> This is VisionFold, a video editing studio. Scroll down and you'll hit the reel. That's real client work.
>
> Projects run in four passes. First cut in three to five days. You approve every stage.
>
> Pricing is not a mystery. The quote builder sends you a real number within twenty four hours.
>
> When you're ready, send a brief. No calls required.

---

## 4. Fifteen-second hook (~38 words)

For social, or the pill's preview loop.

> This is VisionFold. You send footage, we send back a film people finish watching. First cut in three to five days, a real quote in twenty four hours, and no calls required.

---

## 5. Delivery notes for the character

- **Pace:** about one hundred and fifty words per minute. Unhurried. This is a
  studio lead being helpful, not an ad.
- **Tone:** warm, plain, slightly dry. Confidence comes from specifics — "three
  to five days" — never from adjectives like "amazing" or "world-class".
- **Never say:** "welcome to our website", "we are passionate about", "look no
  further", "in today's digital landscape". They read as filler and cost trust.
- **Emphasis:** land on the numbers — *three to five days*, *twenty four hours*,
  *no calls*. Those are the lines that convert.
- **Eyeline:** to camera on the first and last beats. Elsewhere it can drift
  toward the section being discussed.
- **Silence:** leave roughly half a second after "no hidden fees" and before the
  final CTA. The pause is what makes the ask land.

## 6. Production specs (so it drops straight into the repo)

| Setting | Value | Reason |
| --- | --- | --- |
| Format | MP4, H.264, AAC audio | Plays everywhere, no transcoding |
| Resolution | 720×1280 (vertical) or 1080×1080 (square) | The card is portrait on mobile, square on desktop |
| Duration | 45–60 s | Past a minute, completion falls off a cliff |
| File size | **under 8 MB** | It loads on a phone connection, and stays reasonable in git |
| Frame rate | 30 fps | Half the size of 60 for talking-head content |
| Audio | −16 LUFS, mono is fine | Consistent loudness with the rest of the site |
| Poster | 1 JPG, same aspect, under 150 KB | Shows before playback, avoids a black box |
| Background | Ink `#0B1020` or a cut-out character on transparent → composited on ink | Sits inside the card without a visible seam |

### Where to put the files

```
public/guide/site-guide.mp4     ← the video
public/guide/site-guide.jpg     ← poster frame
public/guide/site-guide.vtt     ← captions (already written, see below)
```

Drop them in and the guide appears by itself. **If the video is missing, the
component renders nothing** — no broken player, no console noise — so the repo is
safe to ship before the video exists.

If the file ends up larger than about 10 MB, host it instead and set
`NEXT_PUBLIC_SITE_GUIDE_SRC` to the URL. Large binaries in git slow every clone
forever, and video is the worst offender.

### Captions

`public/guide/site-guide.vtt` ships with timings already matched to the sixty
second script. If your tool changes the pacing, adjust the timecodes there — the
player loads it automatically and captions are **on by default**, because most
people watch muted the first time.

---

## 7. What's already built

`src/components/SiteGuide.tsx`, mounted in the public layout:

- **Probes for the video before rendering anything.** No file, no component —
  the site is unchanged until you add `public/guide/site-guide.mp4`.
- Invitation pill sits at `bottom-24 right-5`, stacked **above** the WhatsApp
  button so the two never collide.
- Never autoplays with sound. Playback starts only when someone taps it, which
  is also what browser autoplay policy requires for audio.
- Captions load from the VTT and are available immediately; mute toggle included.
- "Don't show again" is remembered in `localStorage`, so returning visitors are
  not nagged.
- `Escape` closes it, the pulse respects `prefers-reduced-motion`, and the card
  ends on a single CTA: **Send a brief**.

## 8. Handing me the video

Send the file and I'll commit it to `public/guide/`. Before you do:

1. Export **MP4 / H.264**, 30 fps, vertical 720×1280 or square 1080×1080.
2. Keep it **under 8 MB** — a talking head at 60 seconds compresses to about
   4–6 MB at a sensible bitrate.
3. Include a poster frame as `site-guide.jpg` (under 150 KB).
4. If your tool only exports something much larger, don't force it into git —
   host it and set `NEXT_PUBLIC_SITE_GUIDE_SRC` to the URL instead. The component
   reads that environment variable first.

If the pacing of your generated read differs from the script, update the
timecodes in `public/guide/site-guide.vtt` so the captions stay in sync.
