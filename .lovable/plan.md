## Goal
Add a one-click export from the **VC pitch summary** panel that produces a shareable **PDF** or **PowerPoint (.pptx)** of the deck.

## UX
- Two buttons in the VC summary panel header: **Download PDF** and **Download PPTX**.
- Both run fully client-side (no backend), trigger a browser download named `pitchcast-summary.pdf` / `pitchcast-summary.pptx`.
- Show a small spinner on the button while generating; disable both during export.
- A toast on success / failure (using the existing `sonner` setup).

## Content of the exported deck
Each export contains the same 4 slides, built from the live forecast data already in scope (`rows`, `tiers`, `assumptions`, `KPIs`):

1. **Cover** — "Pitchcast" wordmark, tagline "Forecast · Model · Fundraise", company-name placeholder, ARR headline.
2. **The pitch** — the auto-generated headline sentence + the 4 numbered bullets already shown in `VCSummary`.
3. **Key metrics** — 2×2 grid: MRR, ARR, LTV/CAC, Break-even month.
4. **Forecast at a glance** — a rendered revenue chart image + Ask / Use / Runway / Milestone stat strip.

The deck inherits the Pitchcast palette (deep cocoa background, amber primary, teal accent) so the file matches the app.

## Technical approach
Two new deps, both pure-JS / Worker-safe (no native Node, no server):
- `pptxgenjs` — generates `.pptx` in the browser.
- `jspdf` — generates `.pdf` in the browser.

For slide 4's chart image, use `html-to-image` (or `dom-to-image-more`) to snapshot the existing `RevenueChart` SVG node into a PNG data URL, then embed it in both the PDF and PPTX. The chart already lives on the page, so we just grab its DOM node by ref — no second render needed.

New files:
- `src/lib/export/deck.ts` — pure builder: takes `{ rows, tiers, assumptions, kpis, chartPng }` and returns slide content (title, bullets, stats). Shared by both exporters so the two outputs stay in sync.
- `src/lib/export/pdf.ts` — `exportPdf(deckData)` using jsPDF, 4 pages, branded colors.
- `src/lib/export/pptx.ts` — `exportPptx(deckData)` using pptxgenjs, 16:9, same 4 slides.
- `src/components/planner/ExportButtons.tsx` — the two buttons + loading state + toast.

Changes to existing files:
- `src/components/planner/VCSummary.tsx` — accept an optional `chartRef` (or expose a ref via the parent) and render `<ExportButtons />` in the panel header area.
- `src/components/planner/ForecastCharts.tsx` — forward a `ref` to the chart container so the export can snapshot it.
- `src/routes/index.tsx` — wire a `chartRef` between the Forecast panel and the VC summary panel; pass it down.

## Out of scope
- No editable "company name" field yet (uses a placeholder like "Your AI startup" — we can wire a real input later if you want).
- No email-sending or cloud upload — pure local download.
- No editable slide template selection.

## Confirmation
If this matches what you wanted, hit **Implement plan** and I'll build it.