# VisionFold Review & Annotation Engine

## Defaults (confirmed for build)

| Question | Assumption |
|----------|------------|
| Formats | **mp4** primary; **webm** secondary. Prefer H.264/AAC in mp4 for scrub reliability. MOV: ask client to export mp4. |
| Max size | Align with media library direct upload (~100MB practical on free Supabase; raise with plan). |
| Storage | **Supabase Storage only** (`visionfold-uploads`). CDN = future. |
| Drawing in v1 | **No** — Phase R3 is timecode + text. Drawing = R4. |
| Approve lock | Client **Approve is one-way** (locked). Admin can unlock / reset to pending. |
| Entity | New **`media_versions`** linked to `projects`. `delivered_files` jsonb remains legacy until migration. |

## Auth reality (important)

VisionFold uses **custom JWT + Express + Supabase service role**.  
RLS on review tables protects direct PostgREST/anon access.  
**Primary enforcement** for portal users is still `assertProjectAccess` in Express (same as rest of portal).

## Phase status

| Phase | Status |
|-------|--------|
| R1 Schema + RLS | SQL shipped: `supabase/migrations/20260807_review_r1.sql` |
| R2 Direct upload + version list | Next |
| R3 Player + timecode comments | Partial UI exists (`VideoReviewPlayer`); cut over to SQL tables in R2/R3 |
| R4 Drawing | Not started |
| R5 Carry-forward | Schema columns ready (`carried_from_version_id`, `carry_status`) |
| R6 Realtime | Not started |
| R7 Approval lock | Partial; lock column in SQL |
| R8 Polish | Not started |

## AutoClip

Separate Python engine. Optional `AUTOCLIP_BASE_URL`. Not required for review.
