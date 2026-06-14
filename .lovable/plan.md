## Add Ownership & Dilution section

Add a new interactive section below the VC pitch summary that models a priced equity round, shows ownership split, and warns founders about the option pool trap.

### UI additions

1. **New Panel** — "Ownership & Dilution" below the VC pitch summary panel in `src/routes/index.tsx`.

2. **Inputs** (grid matching AssumptionsPanel style):
   - Raise amount ($) — number input, default $500K
   - Pre-money valuation ($) — number input, default $2M
   - Option pool % — slider (0–20) + number input, default 10%

3. **Calculated read-only stats** (four small cards):
   - Post-money valuation = pre + raise
   - Investor % = raise / post-money
   - Founder % = 100% – investor % – option pool %
   - Option Pool % (echo of input, shown for symmetry)

4. **Horizontal stacked bar** — 100% width bar segmented into Founder / Investor / Option Pool, color-coded with existing theme colors (use primary, muted-foreground, secondary). Labels show `XX%` inside each segment when width allows, or below.

5. **Info callout** — Alert-style box titled "The option pool trap" explaining that the pool dilutes the founder, not the investor, because it is carved from the pre-money. Example: if investor buys 20% and a 10% pool is created, founder drops to 70% (not 80%).

6. **Tooltips** — each input label uses the existing `<Term>` component (like AssumptionsPanel). Add new glossary entries: `raise-amount`, `pre-money`, `option-pool`, `post-money`, `investor-pct`, `founder-pct`.

### State & persistence

- Store `Ownership` shape in a new state object: `{ raise: number; preMoney: number; optionPoolPct: number }`.
- Default values: `{ raise: 500_000, preMoney: 2_000_000, optionPoolPct: 10 }`.
- Persist to localStorage under the same `STORAGE_KEY` as the rest of the app (merge into existing object).
- Reset button on the panel resets to defaults.

### Files to create / edit

| File | Action |
|---|---|
| `src/components/planner/OwnershipPanel.tsx` | New component: inputs, calculations, stacked bar, callout |
| `src/lib/glossary.ts` | Add 6 new glossary entries |
| `src/routes/index.tsx` | Import panel, add state, wire into layout below VC pitch summary, persist |

### Visual sketch

```text
+---------------------------------------------------+
|  Ownership & Dilution                             |
|                                                   |
|  [Raise $500K]  [Pre-money $2M]  [Pool ▓▓▓ 10%]   |
|                                                   |
|  Post: $2.5M   Investor: 20%   Founder: 70%      |
|                                                   |
|  | Founder 70% | Investor 20% | Pool 10% |        |
|  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ |
|                                                   |
|  [i] The option pool trap                         |
|      The pool is carved from pre-money, so the... |
+---------------------------------------------------+
```

### Technical notes

- Reuse existing UI primitives: `Input`, `Label`, `Slider` (from `src/components/ui/`), and `Term`.
- The stacked bar is a pure CSS flexbox or grid with inline percentage widths — no chart library needed.
- Calculations are synchronous and local; no server functions or AI calls.