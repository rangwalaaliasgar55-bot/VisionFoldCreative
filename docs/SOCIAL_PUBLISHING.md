# Publishing to YouTube & Instagram ΓÇö what's actually required

Short version: **the SEO half is done and free; the posting half is gated by
Google and Meta, not by code.** This document is the honest path from where the
Social Studio is today to true one-click publishing.

## What ships today (no setup, no keys, no server)

`src/lib/social/engine.ts` + `src/lib/social/lexicon.ts` + `/admin/social`:

- Type what the video is about ΓåÆ **four genuinely different posts**: YouTube
  (search-led: title options, description, chapters, tags), Instagram
  (feel-led: fragments, craft detail, hashtags in the first comment), LinkedIn
  (insight-led: problem ΓåÆ approach ΓåÆ result, ends on a question, no "link in
  bio", Γëñ5 hashtags), and Shorts/Reels (hook-led).
- The engine **analyses before it writes**: detects intent (tutorial / case study
  / BTS / showreel / launch / tips), extracts tools and real metrics, mines
  keyphrases that never cross a sentence boundary or contain a stopword, and
  canonicalises product names (`davinci resolve` ΓåÆ DaVinci Resolve, `4k` ΓåÆ 4K).
- It then **critiques and repairs its own draft**: strips AI filler ("dive deep",
  "in today\'s video"), collapses repeated words, fixes dangling punctuation,
  flags ALL-CAPS and keyword stuffing, scores several title candidates on
  keyword position and length, and keeps the best one.
- A **distinctness check** measures content-word overlap between the platforms
  and fails if they read like copy-paste (the suite enforces <60%).
- `Rewrite` cycles deterministic alternates ΓÇö different angle, same brief.
- Everything is generated **in the browser**, deterministically, with no network
  call and no API key. It works offline.
- Every field is validated against the real platform ceilings, and the thumbnail
  is checked against YouTube's rules (ΓëÑ1280├ù720, 16:9, <2 MB, JPG/PNG/WEBP)
  before you ever open the upload page.
- `Copy` per field, or `Export pack` for a JSON file.
- Regression-tested by `npm run check:social` (5 briefs ├ù 9 platform assertions).

## Why "just log in and post" can't work from a website

| | YouTube Data API v3 | Instagram Content Publishing API |
| --- | --- | --- |
| Account type | Any channel | **Business or Creator only**, linked to a Facebook Page |
| App setup | Google Cloud project + OAuth 2.0 client | Meta app + `instagram_content_publish`, `pages_read_engagement` |
| Human review | **Mandatory API audit.** Until it passes, every upload is forced to `private` regardless of what you request | **App Review** before publishing for accounts you don't own |
| Media source | Multipart upload of the file bytes | Meta **fetches a public URL** ΓÇö you cannot POST the bytes |
| Quota | Upload = 1600 units of 10,000/day ΓåÆ **~6 uploads/day** | 50 posts / 24 h per account |
| Browser calls | Blocked (no CORS, secrets can't be shipped) | Blocked (same) |

Both flows need a confidential client ΓÇö an OAuth client secret plus a long-lived
refresh token ΓÇö which by definition cannot live in the browser. This app already
has a server (Next.js route handlers + Postgres), so that part is fine; the
blockers are the account types and the two review processes.

## Enabling it, in order

1. **YouTube**
   - Google Cloud console ΓåÆ new project ΓåÆ enable *YouTube Data API v3*.
   - Create an OAuth 2.0 Client (type: Web), redirect URI
     `https://<your-domain>/api/admin/social/youtube/callback`.
   - Set `YOUTUBE_CLIENT_ID` and `YOUTUBE_CLIENT_SECRET`. The Social Studio
     switches its YouTube badge to *Credentials set* automatically.
   - Submit the **API audit** (Google asks for a demo video of your flow).
     Expect a couple of weeks. Uploads stay private until it clears.
   - Scope needed: `https://www.googleapis.com/auth/youtube.upload`.

2. **Instagram**
   - Convert the account to Business or Creator and link a Facebook Page.
   - Meta for Developers ΓåÆ new app ΓåÆ add *Instagram Graph API*.
   - Redirect URI `https://<your-domain>/api/admin/social/instagram/callback`,
     then set `META_APP_ID` and `META_APP_SECRET`.
   - Submit **App Review** for `instagram_content_publish`.
   - Publishing is two steps: create a media container pointing at a **public**
     video/image URL, poll until `status_code=FINISHED`, then publish it. The
     site's media library can serve those URLs.

3. **Token storage** ΓÇö persist the refresh tokens server-side (a
   `social_accounts` table keyed by provider), never in `localStorage`. Refresh
   on use; treat them as secrets in logs and backups.

## Recommended interim workflow

1. Generate the pack in `/admin/social`.
2. `Export pack` (JSON) or copy field by field.
3. Upload in YouTube Studio / Instagram and paste. The metadata is already
   inside every limit, so nothing gets truncated or rejected.

This is the same end result as automation for a studio publishing a few videos a
week ΓÇö without waiting on two review queues, and without a daily upload cap.
