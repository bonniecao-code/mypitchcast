## Goal
Two upgrades to Pitchcast:
1. Make the **VC pitch summary** fully editable (company name, headline, bullets, ask/use/runway/milestone) and have edits flow into the PDF/PPTX export.
2. Add an **AI onboarding chatbot** at the top of the page where the founder describes their product + business model in plain English, and Pitchcast pre-fills pricing tiers + assumptions from that conversation.

## Part 1 — Editable VC summary

UX:
- Each text element in `VCSummary` becomes inline-editable (click to edit, blur to save). Bullets get an add/remove control (min 2, max 6).
- A small "Reset to auto-generated" link recomputes everything from the live forecast.
- Edits are persisted in the same `pitchcast.v1` localStorage entry under a new `pitch` key, so they survive reload.

Implementation:
- New `PitchDraft` type: `{ companyName, headline, bullets[], ask, use, runway, milestone }`.
- New hook `usePitchDraft(rows, tiers, assumptions)` that returns a draft seeded from the current auto-generated values, plus setters and a `reset()`. Auto-generated values are recomputed when forecast inputs change *and* the user hasn't manually overridden that field (tracked with a per-field `overridden` flag).
- `VCSummary.tsx` swaps static text for an `<EditableText />` primitive (contentEditable span with placeholder + max length).
- `ExportButtons` + `buildDeck` accept the `PitchDraft` and use its values instead of recomputing — so the downloaded PDF/PPTX matches exactly what's on screen.

## Part 2 — Onboarding chatbot ("Describe your product")

UX:
- New **"Start with AI"** panel at the very top of the page (above the KPI strip), collapsible after first use.
- Simple chat: assistant opens with "Tell me about your product and how you plan to make money." User types one or two messages. After enough info, assistant returns a recommended setup and a single **"Apply to my model"** button.
- Recommendation card shows: business-model summary, 2–4 pricing tiers with type/price/mix, and adjusted assumptions (CAC, conversion, churn, starting visitors). Each row has a checkbox so the founder can apply only parts.

Backend (Lovable AI Gateway, default model `google/gemini-3-flash-preview`):
- New server function `src/lib/ai/recommend.functions.ts` exposing `recommendModel({ messages })`.
- Uses **tool calling** to force structured output matching our `PricingTier[]` + partial `Assumptions` shape (so we can apply it directly without parsing prose).
- System prompt: "You are a startup pricing advisor for AI founders. Given a product description, recommend a pricing model (subscription, one-time, physical, consumable, or a mix) and starter assumptions. Be opinionated and concise."
- Streaming not required for v1 — single request/response keeps it simple; we can stream later if it feels slow.

Frontend:
- New component `src/components/planner/OnboardingChat.tsx` — message list + input + recommendation card.
- Calls the server function via `useServerFn` + `useMutation`.
- On "Apply", calls `setTiers` / `setAssumptions` in `index.tsx` (lifted via props) and scrolls to the forecast.
- Conversation is kept in component state only (not persisted) — it's a one-shot intake, not an ongoing chat.

Prerequisite:
- Enable **Lovable Cloud** + **Lovable AI** if not already enabled, so `LOVABLE_API_KEY` is available to the server function. No user-provided keys needed.

## Files

New:
- `src/components/planner/EditableText.tsx` — inline-editable text primitive.
- `src/hooks/usePitchDraft.ts` — draft state + auto/override logic.
- `src/components/planner/OnboardingChat.tsx` — chat UI + recommendation card.
- `src/lib/ai/recommend.functions.ts` — server function calling Lovable AI Gateway with tool calling.

Edited:
- `src/components/planner/VCSummary.tsx` — wire in editable fields, accept `draft` prop.
- `src/components/planner/ExportButtons.tsx` + `src/lib/export/deck.ts` — accept `draft` and use it for slide content.
- `src/routes/index.tsx` — mount `<OnboardingChat />` at the top, lift pitch draft state, pass to `VCSummary` and `ExportButtons`, persist in localStorage.

## Out of scope
- Multi-turn back-and-forth refinement of the recommendation (v1 is one round; user can re-open the chat to redo).
- Saving multiple named pitch drafts.
- Streaming chat responses.
- Exporting the chat transcript.
