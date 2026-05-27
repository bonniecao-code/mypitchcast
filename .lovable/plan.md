## Plan

Three additions to Pitchcast, wired to Lovable AI (Gemini) via a server function.

### 1. AI onboarding chat hero (top of page)
- New `src/components/planner/OnboardingChat.tsx` replaces the current hero block on `/`.
- Single textarea: "Tell us about your product and how you'd like to make money." + Send button. Below it, 3 example prompts ("AI coding copilot", "Bio-sensor wearable", "Image-gen API").
- On submit → calls a server function which calls Lovable AI with a structured-output tool schema and returns:
  - `summary` (one-paragraph reformulation)
  - `recommendedTiers` (array matching our `PricingTier` shape: name, type, price, mixPct, cogs?, repurchasesPerMonth?)
  - `assumptionOverrides` (partial `Assumptions` — e.g. higher CAC for hardware, lower churn for prosumer)
  - `pitchHeadline` + `pitchBullets[4]` to seed the VC summary
- Renders the response inline as a card with two buttons: **Apply to my plan** (overwrites current tiers/assumptions + seeds VC summary) and **Add as AI suggestion tab** (puts the tiers into the new second pricing tab only). Loading state with spinner + 402/429 toasts.
- Persists last AI response in localStorage so refresh keeps it.

### 2. Second pricing tab — "AI suggested"
- Wrap `PricingBuilder` in a `Tabs` with two tabs: **My tiers** (current editable tiers) and **AI suggested** (tiers from the chatbot, also editable).
- Two independent tier states in `index.tsx`: `tiers` and `aiTiers`. A small "Use these tiers" button on the AI tab copies `aiTiers → tiers`. Forecast/KPIs/VC summary always use the active `tiers` (the My-tiers set) so users can experiment in the AI tab without disturbing their model.
- If the user hasn't run the chatbot yet, the AI tab shows an empty state pointing to the chat.

### 3. Editable VC pitch summary
- `VCSummary.tsx` becomes inline-editable: headline `<h3>` and each of the 4 bullets use `contentEditable` with `onBlur` save (no extra deps). A tiny pencil hint appears on hover.
- Add `vcOverrides: { headline?: string; bullets?: string[] }` state in `index.tsx`, persisted to localStorage alongside `tiers`/`assumptions`. The component renders override-or-default for each field, with a small "Reset to auto" link when any override exists.
- Edited text flows into the existing PDF/PPTX export via `buildDeck()` (deck.ts will accept optional `headlineOverride` / `bulletsOverride`).
- The AI chat's `pitchHeadline` / `pitchBullets` populate `vcOverrides` when the user clicks **Apply to my plan**.

### Technical details

**New files**
- `src/components/planner/OnboardingChat.tsx` — chat hero UI.
- `src/lib/ai/recommendation.functions.ts` — `createServerFn({ method: "POST" })` that calls `https://ai.gateway.lovable.dev/v1/chat/completions` with `google/gemini-3-flash-preview`, `tool_choice` forcing a `recommend_business_model` tool whose JSON schema mirrors `PricingTier` + `Assumptions` + pitch fields. Reads `process.env.LOVABLE_API_KEY` inside `.handler()`. Handles 429/402 by returning `{ error }` shape.
- `src/components/planner/EditableText.tsx` — small reusable `contentEditable` wrapper used by `VCSummary`.

**Edited files**
- `src/routes/index.tsx` — replace the current hero `<h1>` block with `<OnboardingChat onApply={...} onSuggest={...} />`; add `aiTiers` + `vcOverrides` state; wire localStorage; pass `vcOverrides` + setter to `VCSummary`; wrap `PricingBuilder` in Tabs.
- `src/components/planner/PricingBuilder.tsx` — no behavior change; just used twice now.
- `src/components/planner/VCSummary.tsx` — accept `overrides` + `onOverrideChange`; render `EditableText` for headline + each bullet; show "Reset to auto" when overrides present.
- `src/lib/export/deck.ts` — accept optional `headlineOverride` / `bulletsOverride` and prefer them over computed defaults.
- `src/components/planner/ExportButtons.tsx` — forward overrides into `buildDeck()`.

**Backend**
- Lovable Cloud + `LOVABLE_API_KEY` are required. Plan will check/enable them on implement.
- Model: `google/gemini-3-flash-preview`. Structured output via tool calling (per gateway guidelines — not JSON-in-prompt).
- System prompt anchors recommendations to our 5 tier types (free, subscription, one_time, physical, consumable) and asks for `mixPct` summing ≈100.
- No streaming needed (short structured response). Toast on 402/429 with the standard messages.

### Out of scope
- Saving multiple named scenarios.
- Multi-turn chat memory (single-shot recommendation only).
- AI editing of the VC summary after the initial seed — user edits manually.
