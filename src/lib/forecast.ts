export type TierType =
  | "free"
  | "subscription"     // recurring (monthly or yearly billing)
  | "one_time"         // one-time digital (lifetime license, course, ebook)
  | "physical"         // one-time physical product (with unit cost / COGS)
  | "consumable";      // recurring physical reorders (refills, supplements, biomaterials)

export type BillingPeriod = "monthly" | "yearly";

export type PricingTier = {
  id: string;
  name: string;
  type: TierType;
  price: number;             // subscription: per period (mo or yr); others: per purchase
  mixPct: number;            // share of paying customers picking this tier, 0-100
  cogs?: number;             // per-unit cost (physical / consumable)
  repurchasesPerMonth?: number; // consumable only: avg reorders per active customer per month
  billingPeriod?: BillingPeriod; // subscription only; defaults to "monthly"
};

export const tierTypeMeta: Record<TierType, { label: string; hint: string }> = {
  free:         { label: "Free",                hint: "$0 — lead gen, no revenue" },
  subscription: { label: "Subscription",        hint: "Recurring (monthly or yearly)" },
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
  mrr: number;              // monthly-smoothed recurring revenue (monthly subs + consumable)
  oneTimeRev: number;       // one-time digital + physical + yearly sub charges/renewals
  revenue: number;
  cogs: number;             // physical + consumable unit costs
  costs: number;
  netCashflow: number;
  cumulativeCash: number;
};

export const defaultTiers: PricingTier[] = [
  { id: "t1", name: "Free",     type: "free",         price: 0,   mixPct: 0 },
  { id: "t2", name: "Pro",      type: "subscription", price: 29,  mixPct: 45, billingPeriod: "monthly" },
  { id: "t6", name: "Pro Annual", type: "subscription", price: 290, mixPct: 15, billingPeriod: "yearly" },
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

const isYearlySub = (t: PricingTier) =>
  t.type === "subscription" && t.billingPeriod === "yearly";
const isMonthlySub = (t: PricingTier) =>
  t.type === "subscription" && (t.billingPeriod ?? "monthly") === "monthly";

export function runForecast(tiers: PricingTier[], a: Assumptions): MonthRow[] {
  const paid = tiers.filter((t) => t.type !== "free");
  const mixTotal = paid.reduce((s, t) => s + t.mixPct, 0) || 1;

  // Recurring base = monthly subs + consumable + yearly subs (yearly contributes to active count, not MRR)
  const monthlySubShare = paid.filter(isMonthlySub).reduce((s, t) => s + t.mixPct, 0) / mixTotal;
  const yearlySubShare  = paid.filter(isYearlySub).reduce((s, t) => s + t.mixPct, 0) / mixTotal;
  const consumableShare = paid.filter((t) => t.type === "consumable").reduce((s, t) => s + t.mixPct, 0) / mixTotal;
  const recurringShare = monthlySubShare + yearlySubShare + consumableShare;

  // Smoothed MRR from monthly subs (per active recurring customer)
  const monthlySubARPU = paid
    .filter(isMonthlySub)
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

  // Yearly subs: lump-sum charge per new yearly customer + renewals every 12 months
  const yearlyARPUperYearly = yearlySubShare > 0
    ? paid.filter(isYearlySub).reduce((s, t) => s + (t.price * t.mixPct) / mixTotal, 0) / yearlySubShare
    : 0;

  const oneTimeARPU = paid
    .filter((t) => t.type === "one_time" || t.type === "physical")
    .reduce((s, t) => s + (t.price * t.mixPct) / mixTotal, 0);

  const oneTimeCOGSperNew = paid
    .filter((t) => t.type === "physical")
    .reduce((s, t) => s + ((t.cogs ?? 0) * t.mixPct) / mixTotal, 0);

  const rows: MonthRow[] = [];
  let visitors = a.startingVisitors;
  let activePaid = 0; // total recurring active (smoothed)
  // Track yearly cohorts by acquisition month to handle 12-month renewals.
  // cohorts[i] = active customers acquired in month (i+1)
  const yearlyCohorts: number[] = [];
  let cumulative = 0;

  for (let m = 1; m <= a.months; m++) {
    const signups = visitors * (a.signupConvPct / 100);
    const newPaid = signups * (a.paidConvPct / 100);
    const newRecurring = newPaid * recurringShare;
    const newYearly = newPaid * yearlySubShare;

    const churnRate = a.monthlyChurnPct / 100;
    const churned = activePaid * churnRate;
    activePaid = activePaid - churned + newRecurring;

    // Decay each existing yearly cohort by churn, then add the new cohort
    for (let i = 0; i < yearlyCohorts.length; i++) {
      yearlyCohorts[i] = yearlyCohorts[i] * (1 - churnRate);
    }
    yearlyCohorts.push(newYearly);

    // Yearly cash this month: new acquisitions (this month's cohort) + renewals from cohorts at multiples of 12 months ago
    let yearlyCash = newYearly * yearlyARPUperYearly;
    // cohort acquired in month (m - 12), (m - 24), ... renews this month
    for (let k = 12; k <= m - 1; k += 12) {
      const cohortIdx = m - 1 - k; // 0-based index in yearlyCohorts (push order matches month)
      if (cohortIdx >= 0 && cohortIdx < yearlyCohorts.length - 1) {
        yearlyCash += yearlyCohorts[cohortIdx] * yearlyARPUperYearly;
      }
    }

    // Smoothed MRR comes from monthly subs + consumables only (not yearly)
    const smoothedShare = monthlySubShare + consumableShare;
    const mrr = recurringShare > 0
      ? activePaid * (smoothedShare / recurringShare) * ((monthlySubARPU + consumableARPU) / Math.max(smoothedShare, 1e-9))
      : 0;

    const oneTimeRev = newPaid * oneTimeARPU + yearlyCash;
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
  // ARR: smoothed MRR × 12 + annualized yearly-sub revenue captured in oneTimeRev is lumpy,
  // so approximate ARR using last 12 months of total revenue when horizon allows; fallback to mrr*12.
  const lastN = rows.slice(-Math.min(12, rows.length));
  const trailing12Rev = lastN.reduce((s, r) => s + r.revenue, 0);
  const arr = rows.length >= 12 ? trailing12Rev : last.mrr * 12;
  const arpu = last.activePaid > 0 ? (arr / 12) / last.activePaid : 0;
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
