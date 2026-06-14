import { Check, AlertTriangle } from "lucide-react";
import type { MonthRow, Assumptions } from "@/lib/forecast";
import { fmtCurrency } from "@/lib/forecast";
import { Term } from "./Term";

type KPIs = {
  ltvCac: number;
  breakEven: number | null;
  mrr: number;
  arr: number;
};

type Props = {
  rows: MonthRow[];
  assumptions: Assumptions;
  kpis: KPIs;
  raise: number;
};

type CheckItem = {
  label: React.ReactNode;
  pass: boolean;
  detail: string;
  fix: string;
};

export function ReadyToRaise({ rows, assumptions, kpis, raise }: Props) {
  // Average monthly burn = mean of negative net cashflow months before break-even
  const burnMonths = rows.filter((r) => r.netCashflow < 0);
  const avgBurn =
    burnMonths.length > 0
      ? burnMonths.reduce((s, r) => s + Math.abs(r.netCashflow), 0) / burnMonths.length
      : 0;
  const runwayMonths = avgBurn > 0 ? Math.floor(raise / avgBurn) : Infinity;
  const runwayLabel = runwayMonths === Infinity ? "∞" : `${runwayMonths} mo`;

  const checks: CheckItem[] = [
    {
      label: <>Runway &gt; 6 months</>,
      pass: runwayMonths > 6,
      detail: `${runwayLabel} at ${fmtCurrency(avgBurn)}/mo burn on a ${fmtCurrency(raise)} raise`,
      fix: "Raise more, cut fixed costs, or trim CAC so your cash lasts past month 6.",
    },
    {
      label: <><Term term="ltv-cac">LTV / CAC</Term> &ge; 3</>,
      pass: kpis.ltvCac >= 3,
      detail: `${kpis.ltvCac.toFixed(2)}x today`,
      fix: "Lower CAC, raise price, or reduce churn — each customer must earn back at least 3× what they cost to acquire.",
    },
    {
      label: <>Monthly churn below 5%</>,
      pass: assumptions.monthlyChurnPct < 5,
      detail: `${assumptions.monthlyChurnPct.toFixed(1)}% / month`,
      fix: "Fix the leak before scaling: investors discount growth heavily when customers leave faster than 5% a month.",
    },
    {
      label: <>Reaches <Term term="break-even">break-even</Term> in horizon</>,
      pass: kpis.breakEven !== null,
      detail: kpis.breakEven ? `Month ${kpis.breakEven} of ${assumptions.months}` : `No break-even within ${assumptions.months} months`,
      fix: "Extend the forecast horizon, raise prices, or compress fixed costs so the model shows a profitable month.",
    },
  ];

  const passed = checks.filter((c) => c.pass).length;

  // Stage detection from ARR
  const arr = kpis.arr;
  let stage: { name: string; cares: string };
  if (arr < 250_000) {
    stage = {
      name: "Pre-seed",
      cares: "Pre-seed investors back the founder and a sharp wedge — they want conviction, not metrics.",
    };
  } else if (arr < 2_000_000) {
    stage = {
      name: "Seed",
      cares: "Seed investors want early signs of product-market fit: retained users, repeat purchases, and a working acquisition channel.",
    };
  } else {
    stage = {
      name: "Series A",
      cares: "Series A investors want repeatable, predictable growth — healthy unit economics and a channel they can pour fuel on.",
    };
  }

  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between">
        <div className="text-sm text-muted-foreground">
          {passed} of {checks.length} checks passing
        </div>
        <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
          ARR {fmtCurrency(arr)}
        </div>
      </div>

      <ul className="space-y-3">
        {checks.map((c, i) => (
          <li
            key={i}
            className={`rounded-lg border p-3 ${
              c.pass ? "border-success/30 bg-success/5" : "border-warning/30 bg-warning/5"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                  c.pass ? "bg-success/20 text-success" : "bg-warning/20 text-warning"
                }`}
              >
                {c.pass ? <Check className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="text-sm font-medium">{c.label}</div>
                  <div className="text-xs num text-muted-foreground">{c.detail}</div>
                </div>
                {!c.pass && (
                  <div className="mt-1.5 text-xs text-muted-foreground">{c.fix}</div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
        <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
          Best-fit stage
        </div>
        <div className="mt-1 font-display text-2xl text-primary">{stage.name}</div>
        <div className="mt-1 text-sm text-muted-foreground">{stage.cares}</div>
      </div>
    </div>
  );
}
