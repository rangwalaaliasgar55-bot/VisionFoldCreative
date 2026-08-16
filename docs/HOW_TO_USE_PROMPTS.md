# How to Use the VisionFold Prompts — Step-by-Step

## Quick Start (2 minutes)

You have 3 documents:

- **`docs/VISIONFOLD_MOTION_REDESIGN_BRIEF.md`** — the truth (hand this + a prompt)
- **`PROMPT_FOR_CLAUDE_OPUS_4.5.md`** — for Claude Opus 4.5 (code-perfect)
- **`PROMPT_FOR_FABLE_5.md`** — for Fable 5 / GPT-5 / Gemini 2.5 (motion-feel)

### Option A: Give to Claude Opus (Recommended)

1. Go to https://claude.ai → New chat → Model: **Claude 3 Opus** or `Claude Opus 4.5` via API.
2. Open `PROMPT_FOR_CLAUDE_OPUS_4.5.md` in your editor, select all, copy.
3. Paste as **first message** (no extra “hi”).
4. Opus will:
   - Read the brief
   - Plan 5 phases
   - Edit `ThreeBackground.tsx`, `Fx.tsx`, `ClientsGlobeSection.tsx`, `globals.css`, etc.
   - Run `npm run build` after each file until green.

**API variant:**

```bash
# If using Claude API
cat PROMPT_FOR_CLAUDE_OPUS_4.5.md | \
  npx @anthropic-ai/claude-code --model claude-3-opus-20240229
# Or paste into any Opus-compatible agent
```

### Option B: Give to Fable 5 / GPT-5

1. Open https://chat.openai.com (GPT-5) or https://gemini.google.com (2.5 Pro) or Fable.
2. Enable **Creative / Canvas / Artifact** mode if available.
3. Copy all of `PROMPT_FOR_FABLE_5.md`, paste.
4. Model will act as motion director, fix feel, and describe the glide.

### Option C: Give Both (Best)

Send **both** to two different models, then compare:

- Opus PR will be **type-perfect + build-green**
- Fable PR will be **motion-perfect + bloom+feel**

Merge the best of both.

---

## What Each Prompt Contains

| Section | Opus | Fable |
|---------|------|-------|
| System prompt | Stern craftsman, plan-first | Motion director, vibe-first |
| Repo read order | 10 files enumerated | Brief + 3 components story |
| Diagnosis | Bug taxonomy (6 feels) | Vibe collapse (Apple vs CodePen) |
| Spec | File-level diffs with code + values | Feel language + easing curve |
| Acceptance | 9 checkboxes + `npm` commands | 60fps eye-test + screen capture |
| Easing | `cubic-bezier(0.16,1,0.3,1)` + spring 120/18 | “One camera” metaphor |
| Output | File list + tradeoffs | 3-sec capture description |

Both end with: **“Now direct. No preamble.”** — so they start coding instantly.

---

## After They Finish — Verify

Ask the model to run:

```bash
npm ci
npm run build && npm run typecheck && npm run lint
npm run dev  # scroll top→bottom, drag globe/reel/split
```

Checklist:

- [ ] Every stagger 70ms? `grep -r "delay={i"` → all 70
- [ ] Every Tilt 7? `grep -r "Tilt max"` → all 7
- [ ] `scaleX` not `width` for progress? `grep -r "scaleX" ScrollProgress.tsx` → found
- [ ] Globe flings? Drag → release → should glide 1.5s
- [ ] No build errors?

---

## Troubleshooting

**Model says “I can’t edit files”** → You gave it chat, not agent. Use Claude Code / Cursor / any tool-enabled agent with bash+edit.

**Model hallucinates new deps** → The brief restricts to `lenis` + `framer-motion` only; tell it: “Do not add @react-three/fiber unless brief says so.”

**Motion still feels off** → Tell it: “Re-read docs/VISIONFOLD_MOTION_REDESIGN_BRIEF.md §3.1 — unify to 620ms, not 700ms.”

---

## One-Liner Delegation (If You Want to Skip Files)

Paste this anywhere:

> Read `docs/VISIONFOLD_MOTION_REDESIGN_BRIEF.md` fully. Fix motion to be identical/effortless/cinematic: unify to `cubic-bezier(0.16,1,0.3,1)` 620ms, 70ms stagger, Tilt 7, PBR wireframe emissive 0.22, Lenis 1.2, scaleX progress, drag inertia decay 0.965 delta-normalized, fallback globe texture. Prove `npm run build` green.

That’s the whole prompt compressed.

