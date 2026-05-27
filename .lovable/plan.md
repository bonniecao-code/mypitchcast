## Goal
Right now the VC pitch summary is generated purely from KPI math (`autoPitch` in `usePitchDraft.ts`), so it ignores everything the founder typed into the onboarding chatbot. We'll make the pitch summary reflect the actual product description: company name, headline, bullets, ask/use/runway/milestone all tailored to what was said in the chat.

## Approach

### 1. Extend the AI recommendation to include pitch content
In `src/lib/ai/recommend.functions.ts`, add a `pitch` object to the `recommend_business_model` tool schema:
- `companyName` (string, short suggested name based on product)
- `oneLiner` (string, headline-style "X is a Y that does Z")
- `bullets` (array of 3–4 strings: traction story, why-now, unit-economics narrative, GTM/wedge — written for VCs)
- `use` (1 short phrase, e.g. "Lab pilots + GTM")
- `milestone` (1 short phrase, e.g. "10 design partners + FDA pre-sub")

Update the system prompt: also act as a VC pitch coach. Reference concrete product nouns from the chat (don't say "Your AI startup" — use the actual thing).

Keep `ask` and `runway` numeric/derived (they come from the forecast: 2× peak burn, horizon months) — but allow the AI to suggest a `use` and `milestone` that fit the product.

### 2. Apply the pitch to the editable draft on "Apply to my model"
- `OnboardingChat` already calls `onApply(tiers, assumptions)`. Extend the signature to `onApply(tiers, assumptions, pitchSeed)` where `pitchSeed` is the AI's pitch object plus the raw product description.
- In `src/routes/index.tsx`, the existing `applyAiRecommendation` currently calls `pitchApi.resetToAuto()`. Replace that with a new `pitchApi.applyAiSeed(pitchSeed)` that:
  - Sets `companyName` if the user is still on the default ("Your AI startup").
  - Sets `headline` = `oneLiner` (override).
  - Sets `bullets` = AI bullets, but blends in one auto-computed unit-economics line from the live KPIs (LTV/CAC, break-even) so numbers stay truthful.
  - Sets `use` and `milestone` overrides.
  - Leaves `ask` and `runway` as auto (KPI-derived) so they stay correct when the forecast changes.

### 3. Keep the "smart" feel after edits
- Persist the AI seed alongside `PitchDraft` in localStorage so a reload still shows the tailored pitch.
- The existing "Reset to auto-generated" link should clear AI overrides too and fall back to the math-only pitch.
- When the founder edits assumptions/tiers, auto-only fields (`ask`, `runway`, the unit-economics bullet) update live; AI-driven fields stay until the founder re-runs the chatbot or hits reset.

### 4. Wire-up
Files touched:
- `src/lib/ai/recommend.functions.ts` — extend tool schema + system prompt to also return `pitch`.
- `src/components/planner/OnboardingChat.tsx` — pass `recommendation.pitch` through `onApply`; show a one-line preview ("Pitch headline: …") in the recommendation card so the founder sees it before applying.
- `src/hooks/usePitchDraft.ts` — add `applyAiSeed(seed)` method; merge AI bullet text with one always-live KPI bullet inside `resolved`.
- `src/routes/index.tsx` — pass the seed through `applyAiRecommendation`; persist seed in localStorage under the existing `pitchcast.v1` key.

## Out of scope
- Multi-turn refinement of the pitch (still one-shot from the chat).
- Re-running the AI when the founder edits assumptions (manual re-chat only).
- Streaming responses.
