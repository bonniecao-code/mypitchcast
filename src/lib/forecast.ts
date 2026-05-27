export type PricingTier = {
  id: string;
  name: string;
  type: "free" | "subscription" | "one_time";
  price: number; // monthly for subscription, lump for one_time
  mixPct: number; // share of paying users (or total visitors for free), 0-100
};

export type Assumptions = {
  startingVisitors: number;
  visitorGrowthPct: number; // monthly growth %
  signupConvPct: number; // visitors -> signups
  paidConvPct: number; // signups -> paying (across non-free tiers)
  monthlyChurnPct: number; // paid churn
  cac: number; // $ per paying customer
  fixedCostsMonthly: number;
  variableCostPct: number; // % of revenue
  months: number;
};

export type MonthRow = {
  month: number;
  visitors: number;
  signups: number;
  newPaid: number;
  activePaid: number;
  mrr: number;
  oneTimeRev: number;
  revenue: number;
  costs: number;
  netCashflow: number;
  cumulativeCash: number;
};

export const defaultTiers: PricingTier[] = [
  { id: "t1", name: "Free", type: "free", price: 0, mixPct: 0 },
  { id: "t2", name: "Pro", type: "subscription", price: 29, mixPct: 75 },
  { id: "t3", name: "Lifetime", type: "one_time", price: 299, mixPct: 25 },
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
  const subs = tiers.filter((t) => t.type === "subscription");
  const ones = tiers.filter((t) => t.type === "one_time");
  const paidTiers = [...subs, ...ones];
  const paidMixTotal = paidTiers.reduce((s, t) => s + t.mixPct, 0) || 1;

  const subARPU =
    subs.reduce((s, t) => s + (t.price * t.mixPct) / paidMixTotal, 0);
  const oneTimeARPU =
    ones.reduce((s, t) => s + (t.price * t.mixPct) / paidMixTotal, 0);

  const subShare = subs.reduce((s, t) => s + t.mixPct, 0) / paidMixTotal;

  const rows: MonthRow[] = [];
  let visitors = a.startingVisitors;
  let activePaid = 0;
  let cumulative = 0;

  for (let m = 1; m <= a.months; m++) {
    const signups = visitors * (a.signupConvPct / 100);
    const newPaid = signups * (a.paidConvPct / 100);
    const newSubs = newPaid * subShare;
    const newOnes = newPaid * (1 - subShare);

    const churned = activePaid * (a.monthlyChurnPct / 100);
    activePaid = activePaid - churned + newSubs;

    const mrr = activePaid * subARPU;
    const oneTimeRev = newOnes * oneTimeARPU;
    const revenue = mrr + oneTimeRev;
    const cacCost = newPaid * a.cac;
    const variable = revenue * (a.variableCostPct / 100);
    const costs = a.fixedCostsMonthly + variable + cacCost;
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
  const ltv =
    a.monthlyChurnPct > 0
      ? (last.activePaid > 0 ? last.mrr / last.activePaid : 0) *
        (1 / (a.monthlyChurnPct / 100))
      : 0;
  const cacPayback =
    last.activePaid > 0 && last.mrr > 0
      ? a.cac / (last.mrr / last.activePaid)
      : 0;
  const ltvCac = a.cac > 0 ? ltv / a.cac : 0;

  // Break-even month: first month cumulative >= 0 after going negative, or first profitable month
  let breakEven: number | null = null;
  for (const r of rows) {
    if (r.netCashflow >= 0) {
      breakEven = r.month;
      break;
    }
  }

  const peakBurn = Math.min(...rows.map((r) => r.cumulativeCash));
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);

  return {
    mrr: last.mrr,
    arr,
    ltv,
    cacPayback,
    ltvCac,
    breakEven,
    peakBurn,
    totalRevenue,
    activePaid: last.activePaid,
  };
}

export function fmtCurrency(n: number) {
  if (Math.abs(n) >= 1_000_000)
    return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}

export function fmtNumber(n: number) {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return Math.round(n).toLocaleString();
}
