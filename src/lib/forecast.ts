export type TierType =
  | "free"
  | "subscription"     // recurring monthly SaaS
  | "one_time"         // one-time digital (lifetime license, course, ebook)
  | "physical"         // one-time physical product (with unit cost / COGS)
  | "consumable";      // recurring physical reorders (refills, supplements, biomaterials)

export type PricingTier = {
  id: string;
  name: string;
  type: TierType;
  price: number;             // per unit (subscription = per month, others = per purchase)
  mixPct: number;            // share of paying customers picking this tier, 0-100
  cogs?: number;             // per-unit cost (physical / consumable)
  repurchasesPerMonth?: number; // consumable only: avg reorders per active customer per month
};

export const tierTypeMeta: Record<TierType, { label: string; hint: string }> = {
  free:         { label: "Free",                hint: "$0 — lead gen, no revenue" },
  subscription: { label: "Subscription",        hint: "Recurring monthly (SaaS, membership)" },
  one_time:     { label: "One-time digital",    hint: "Lifetime license, course, ebook" },
  physical:     { label: "Physical product",    hint: "One shipment, with unit cost (hardware, device)" },
  consumable:   { label: "Consumable / refill", hint: "Recurring reorders (supplements, biomaterials, pods)" },
};

export type Assumptions = {
  startingVisitors: number;
  visitorGrowthPct: number;
  signupConvPct: number;
  paidConvPct: number;
  monthlyChurnPct: number;
  cac: number;
  fixedCostsMonthly: number;
  variableCostPct: number;
  months: number;
};

export type MonthRow = {
  month: number;
  visitors: number;
  signups: number;
  newPaid: number;
  activePaid: number;       // active recurring customers (subs + consumable)
  mrr: number;              // recurring revenue (subs + consumable reorders)
  oneTimeRev: number;       // one-time digital + physical lump
  revenue: number;
  cogs: number;             // physical + consumable unit costs
  costs: number;
  netCashflow: number;
  cumulativeCash: number;
};

export const defaultTiers: PricingTier[] = [
  { id: "t1", name: "Free",     type: "free",         price: 0,   mixPct: 0 },
  { id: "t2", name: "Pro",      type: "subscription", price: 29,  mixPct: 60 },
  { id: "t3", name: "Lifetime", type: "one_time",     price: 299, mixPct: 25 },
  { id: "t4", name: "Starter Kit", type: "physical",  price: 149, mixPct: 10, cogs: 45 },
  { id: "t5", name: "Refill Pack", type: "consumable", price: 39, mixPct: 5,  cogs: 12, repurchasesPerMonth: 0.5 },
];

export const defaultAssumptions: Assumptions = {
  startingVisitors: 2000,
  visitorGrowthPct: 18,
  signupConvPct: 6,
  paidConvPct: 8,
  monthlyChurnPct: 5,
  cac: 35,
  fixedCostsMonthly: 1500,
  variableCostPct: 15,
  months: 24,
};

export function runForecast(tiers: PricingTier[], a: Assumptions): MonthRow[] {
  const paid = tiers.filter((t) => t.type !== "free");
  const mixTotal = paid.reduce((s, t) => s + t.mixPct, 0) || 1;

  // Per-cohort: each "new paid customer" is allocated across paid tiers by mix.
  // Recurring revenue per active recurring customer (sub + consumable monthly value):
  const subShare = paid.filter((t) => t.type === "subscription")
    .reduce((s, t) => s + t.mixPct, 0) / mixTotal;
  const consumableShare = paid.filter((t) => t.type === "consumable")
    .reduce((s, t) => s + t.mixPct, 0) / mixTotal;
  const recurringShare = subShare + consumableShare;

  const subARPU = paid
    .filter((t) => t.type === "subscription")
    .reduce((s, t) => s + (t.price * t.mixPct) / mixTotal, 0);

  const consumableARPU = paid
    .filter((t) => t.type === "consumable")
    .reduce((s, t) => s + (t.price * (t.repurchasesPerMonth ?? 0) * t.mixPct) / mixTotal, 0);

  const consumableCOGSperRecurring = paid
    .filter((t) => t.type === "consumable")
    .reduce(
      (s, t) => s + ((t.cogs ?? 0) * (t.repurchasesPerMonth ?? 0) * t.mixPct) / mixTotal,
      0
    );

  const oneTimeARPU = paid
    .filter((t) => t.type === "one_time" || t.type === "physical")
    .reduce((s, t) => s + (t.price * t.mixPct) / mixTotal, 0);

  const oneTimeCOGSperNew = paid
    .filter((t) => t.type === "physical")
    .reduce((s, t) => s + ((t.cogs ?? 0) * t.mixPct) / mixTotal, 0);

  const rows: MonthRow[] = [];
  let visitors = a.startingVisitors;
  let activePaid = 0; // recurring active customers
  let cumulative = 0;

  for (let m = 1; m <= a.months; m++) {
    const signups = visitors * (a.signupConvPct / 100);
    const newPaid = signups * (a.paidConvPct / 100);
    const newRecurring = newPaid * recurringShare;

    const churned = activePaid * (a.monthlyChurnPct / 100);
    activePaid = activePaid - churned + newRecurring;

    const mrr = activePaid * (recurringShare > 0 ? (subARPU + consumableARPU) / recurringShare : 0);
    // mrr = revenue per active recurring customer × active recurring customers
    const oneTimeRev = newPaid * oneTimeARPU;
    const revenue = mrr + oneTimeRev;

    const cogs =
      activePaid * (recurringShare > 0 ? consumableCOGSperRecurring / recurringShare : 0) +
      newPaid * oneTimeCOGSperNew;

    const cacCost = newPaid * a.cac;
    const variable = revenue * (a.variableCostPct / 100);
    const costs = a.fixedCostsMonthly + variable + cacCost + cogs;
    const net = revenue - costs;
    cumulative += net;

    rows.push({
      month: m,
      visitors: Math.round(visitors),
      signups: Math.round(signups),
      newPaid: Math.round(newPaid),
      activePaid: Math.round(activePaid),
      mrr: Math.round(mrr),
      oneTimeRev: Math.round(oneTimeRev),
      revenue: Math.round(revenue),
      cogs: Math.round(cogs),
      costs: Math.round(costs),
      netCashflow: Math.round(net),
      cumulativeCash: Math.round(cumulative),
    });

    visitors = visitors * (1 + a.visitorGrowthPct / 100);
  }
  return rows;
}

export function computeKPIs(rows: MonthRow[], a: Assumptions) {
  const last = rows[rows.length - 1];
  const arr = last.mrr * 12;
  const arpu = last.activePaid > 0 ? last.mrr / last.activePaid : 0;
  const ltv = a.monthlyChurnPct > 0 ? arpu * (1 / (a.monthlyChurnPct / 100)) : 0;
  const cacPayback = arpu > 0 ? a.cac / arpu : 0;
  const ltvCac = a.cac > 0 ? ltv / a.cac : 0;

  let breakEven: number | null = null;
  for (const r of rows) {
    if (r.netCashflow >= 0) { breakEven = r.month; break; }
  }

  const peakBurn = Math.min(...rows.map((r) => r.cumulativeCash));
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);

  return {
    mrr: last.mrr, arr, ltv, cacPayback, ltvCac,
    breakEven, peakBurn, totalRevenue, activePaid: last.activePaid,
  };
}

export function fmtCurrency(n: number) {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}

export function fmtNumber(n: number) {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return Math.round(n).toLocaleString();
}
