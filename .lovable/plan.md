# Add yearly billing to subscription tiers

## Problem
Today, every `subscription` tier is treated as monthly: the price is added straight into MRR each month and the price label reads `/mo`. A user on annual billing can't represent their actual model — they'd have to divide by 12 manually and lose the upfront cash dynamic.

## Solution
Let each subscription tier declare a billing period: **Monthly** or **Yearly**. Yearly subs are charged once up front per active customer, then renew every 12 months. Other tier types (free, one-time, physical, consumable) are unchanged.

## UX changes (`PricingBuilder.tsx`)
- When `type === "subscription"`, show a new compact toggle next to the price: **Monthly / Yearly**.
- Price suffix updates: `/mo` or `/yr`.
- Tooltip on the toggle explaining how yearly works in the forecast (charged up front, renews after 12 months, churn still applied monthly between renewals).

## Data model (`forecast.ts`)
- Add `billingPeriod?: "monthly" | "yearly"` to `PricingTier` (default `"monthly"` so existing saved models keep working).
- Default tiers stay monthly; one of the seeded tiers can show a yearly example.

## Forecast logic (`runForecast`)
For subscription tiers only:
- **Monthly**: behaves exactly as today — contributes `price` to MRR every month a customer is active.
- **Yearly**:
  - On the month a customer is acquired (or renews), recognize the full annual price as **one-time revenue that month** (so cash flow reflects upfront payment, matching how founders actually receive it).
  - Track an `activeYearly` cohort per tier with a renewal counter; at month 12, 24, … the surviving customers from that cohort generate another upfront charge.
  - Churn continues to be applied monthly to the active yearly cohort (industry-standard way to model annual churn — customers cancel mid-term but the cash is already booked).
  - These customers do NOT contribute to MRR (since the cash is lumpy). Instead they contribute to ARR via `annualPrice × activeYearly`.
- ARR calc updates: `ARR = monthly_MRR × 12 + Σ(yearly_active × yearly_price)`.
- LTV for yearly: `annualPrice / (monthlyChurn × 12)` so LTV/CAC stays comparable.

## Persistence
`billingPeriod` rides along in the same `localStorage` blob as the rest of the tier — no migration needed because the field is optional and defaults to monthly.

## Files to touch
- `src/lib/forecast.ts` — type + forecast math + KPI updates.
- `src/components/planner/PricingBuilder.tsx` — toggle UI + suffix.
- `src/lib/glossary.ts` — add `billing-period` term for the tooltip.

## Out of scope (ask if needed)
- Custom billing periods (quarterly, biennial).
- Discount for annual vs monthly (e.g. "2 months free") — user can just set the annual price to whatever they actually charge.
- Deferred revenue accounting (recognizing 1/12 per month for GAAP) — founders modeling cash runway want cash-in, not GAAP revenue.

## One question before I build
Should yearly revenue show as **one-time cash that month** (matches founder cash reality, what I'd recommend), or **smoothed as 1/12 into MRR each month** (matches SaaS GAAP reporting)? I've planned for the first — let me know if you want the second instead.
