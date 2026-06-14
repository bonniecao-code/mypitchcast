// Plain-English explanations for finance / SaaS / pricing terms.
// Used by <Term> tooltip to make the app readable for non-finance founders.

export const glossary: Record<string, { title: string; body: string; example?: string }> = {
  mrr: {
    title: "MRR — Monthly Recurring Revenue",
    body: "The predictable money your subscriptions bring in every month. Add up what every active paying subscriber pays per month.",
    example: "200 customers × $29/mo = $5,800 MRR",
  },
  arr: {
    title: "ARR — Annual Recurring Revenue",
    body: "MRR × 12. The yearly run-rate of your subscription business. Investors compare you to peers by ARR.",
  },
  ltv: {
    title: "LTV — Lifetime Value",
    body: "Total revenue you expect from one customer before they leave. Higher LTV = each customer is worth more.",
    example: "If a customer pays $29/mo and 5% churn/mo, LTV ≈ $580",
  },
  cac: {
    title: "CAC — Customer Acquisition Cost",
    body: "How much you spend (ads, sales, content) to land one paying customer.",
  },
  "ltv-cac": {
    title: "LTV / CAC ratio",
    body: "How many dollars you get back for every dollar spent acquiring a customer. 3x or higher is healthy. Below 1x means you lose money on each customer.",
  },
  churn: {
    title: "Monthly churn",
    body: "The % of paying customers who cancel each month. Lower is better. 5%/mo is typical for early SaaS; under 2% is great.",
  },
  "break-even": {
    title: "Break-even month",
    body: "The first month your revenue covers all your costs — no more burning cash that month.",
  },
  burn: {
    title: "Peak burn",
    body: "The deepest point your bank account goes before turning positive. This is roughly how much cash you need to raise to survive.",
  },
  runway: {
    title: "Runway",
    body: "How many months you can keep operating before running out of money at the current burn rate.",
  },
  "paid-conv": {
    title: "Signup → paid conversion",
    body: "Of the people who sign up, what % become paying customers. For freemium SaaS, 2–10% is common.",
  },
  "signup-conv": {
    title: "Visitor → signup conversion",
    body: "Of the people who visit your site, what % create an account. 2–8% is a common range.",
  },
  "fixed-costs": {
    title: "Fixed costs",
    body: "Costs you pay every month regardless of sales — salaries, rent, software, hosting baseline.",
  },
  "variable-costs": {
    title: "Variable costs",
    body: "Costs that scale with revenue — payment processing fees (~3%), AI API calls, support, shipping.",
  },
  cogs: {
    title: "COGS — Cost of Goods Sold",
    body: "What it costs you to make/ship one unit. For a physical product priced $80 with $25 unit cost, COGS = $25.",
  },
  mix: {
    title: "Mix %",
    body: "Of your paying customers, what share picks this tier. All paid tiers should add up to 100%.",
  },
  "repurchase-rate": {
    title: "Repurchases per month",
    body: "For consumables (refills, supplies, biomaterials), the average number of times an active customer reorders per month.",
    example: "0.5 = one reorder every 2 months",
  },
  arpu: {
    title: "ARPU — Average Revenue Per User",
    body: "Average money each paying customer brings in per month, blended across all your tiers.",
  },
  "active-paid": {
    title: "Active paying customers",
    body: "How many customers are paying you in a given month (subscribers + recurring consumable buyers).",
  },
  visitors: {
    title: "Visitors",
    body: "Monthly people who land on your site or product page — the top of your funnel.",
  },
  "net-cashflow": {
    title: "Net cashflow",
    body: "Revenue minus all costs for the month. Positive = profit. Negative = burning cash.",
  },
  "cumulative-cash": {
    title: "Cumulative cash",
    body: "Running total of net cashflow since month 1. Shows how deep into the red you go before turning positive.",
  },
  "tier-type": {
    title: "Tier type",
    body: "How customers pay: Free (lead gen), Subscription (recurring monthly), One-time digital (lifetime, course), Physical product (one shipment + unit cost), or Consumable (recurring physical reorders like refills, supplements, biomaterials).",
  },
  "raise-amount": {
    title: "Raise amount",
    body: "How much new cash you're asking investors to put in this round.",
  },
  "pre-money": {
    title: "Pre-money valuation",
    body: "What your company is worth BEFORE the new money comes in. Investor % = raise ÷ (pre-money + raise).",
  },
  "post-money": {
    title: "Post-money valuation",
    body: "Pre-money + the new raise. The company's value the moment after the round closes.",
  },
  "option-pool": {
    title: "Option pool",
    body: "Shares reserved for future hires. Almost always carved from pre-money, meaning it dilutes you (the founder) — not the new investor.",
  },
  "investor-pct": {
    title: "Investor ownership",
    body: "The slice of the company the new investor gets: raise ÷ post-money valuation.",
  },
  "founder-pct": {
    title: "Founder ownership",
    body: "What you keep after the round: 100% − investor % − option pool %. Assumes you started fully owning the company.",
  },
  // Term Sheet Decoder terms
  "liquidation-preference": {
    title: "Liquidation preference",
    body: "Investors get their money back first in a sale. 1x is normal. 2x or 'participating preferred' means they double-dip.",
    example: "1x non-participating: investor gets $1M back, then founders + common split the rest.",
  },
  "anti-dilution": {
    title: "Anti-dilution",
    body: "Protects investors if you raise a future round at a lower price. Broad-based weighted average is standard; full ratchet is a red flag.",
  },
  "pay-to-play": {
    title: "Pay-to-play",
    body: "In a down round, existing investors must invest again or lose preferred rights. Can align incentives or be punitive.",
  },
  "vesting": {
    title: "Vesting",
    body: "Founders earn shares over time, typically 4 years with a 1-year cliff. Leave early and unvested shares go back to the company.",
  },
  "board-of-directors": {
    title: "Board of directors",
    body: "Who controls the company. A 2-founder + 1-investor board keeps founders in charge. Losing majority = you can be fired as CEO.",
  },
  "protective-provisions": {
    title: "Protective provisions",
    body: "Investor veto rights over big decisions: selling the company, raising more money, changing the business. Too many and you can't move fast.",
  },
  "drag-along": {
    title: "Drag-along",
    body: "If a majority wants to sell, minority shareholders can be forced to join. Prevents one small investor from blocking a good exit.",
  },
  "conversion": {
    title: "Conversion",
    body: "When preferred shares turn into common shares, usually at an IPO or acquisition. Preferred investors only convert if the payout is better than their liquidation preference.",
  },
  // Exit Waterfall terms
  "sale-price": {
    title: "Sale price",
    body: "The hypothetical price someone might pay to acquire your company. Used to model how investors and founders split the proceeds.",
  },
  "invested-amount": {
    title: "Invested amount",
    body: "How much the investor put into the company. This is the 1x liquidation preference they get back first in a sale.",
  },
  "investor-ownership": {
    title: "Investor ownership %",
    body: "The slice of the company the investor owns. They get this percentage of remaining proceeds after their liquidation preference is paid.",
  },
  "participating-preferred": {
    title: "Participating preferred",
    body: "The investor gets their 1x money back FIRST, then ALSO takes their ownership % of what is left. This double-dips at the founder's expense.",
    example: "$2M invested, 20% ownership, $10M sale: investor gets $2M + 20% of $8M = $3.6M. Founder gets $6.4M.",
  },
  "non-participating-preferred": {
    title: "Non-participating preferred",
    body: "The investor chooses the better of (1) getting their 1x money back, or (2) converting to common and just taking their ownership %. They cannot do both.",
    example: "$2M invested, 20% ownership, $10M sale: 20% of $10M = $2M, so they are indifferent. Founder gets $8M either way.",
  },
};

export type GlossaryKey = keyof typeof glossary;

