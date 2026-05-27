import type { Assumptions, MonthRow, PricingTier } from "@/lib/forecast";
import { computeKPIs, fmtCurrency, fmtNumber } from "@/lib/forecast";

type Props = {
  rows: MonthRow[];
  tiers: PricingTier[];
  assumptions: Assumptions;
};

export function VCSummary({ rows, tiers, assumptions }: Props) {
  const k = computeKPIs(rows, assumptions);
  const askMultiple = 2; // ~24mo runway buffer
  const suggestedRaise = Math.max(0, -k.peakBurn) * askMultiple || 250_000;

  const bullets = [
    `Reaches ${fmtCurrency(k.arr)} ARR by month ${assumptions.months} with ${fmtNumber(k.activePaid)} paying customers.`,
    `LTV/CAC of ${k.ltvCac.toFixed(2)}x — ${k.ltvCac >= 3 ? "healthy unit economics" : "needs to improve before scaling spend"}.`,
    `${k.breakEven ? `Breaks even on month ${k.breakEven}.` : "Does not reach monthly break-even in horizon — extend or cut costs."}`,
    `Peak cash need: ${fmtCurrency(Math.abs(k.peakBurn))}. Suggested raise: ${fmtCurrency(suggestedRaise)} (≈2x peak burn).`,
  ];

  const pricingLine = tiers
    .filter((t) => t.mixPct > 0 || t.type === "free")
    .map((t) => `${t.name} ($${t.price}${t.type === "subscription" ? "/mo" : t.type === "one_time" ? " one-time" : " free"})`)
    .join(" · ");

  return (
    <div className="space-y-5">
      <div>
        <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">The pitch</div>
        <h3 className="font-display text-2xl mt-1">
          An AI product on a {pricingLine || "tiered"} model, projecting{" "}
          <span className="text-primary">{fmtCurrency(k.arr)}</span> ARR in {assumptions.months} months.
        </h3>
      </div>

      <ul className="space-y-2">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-3 text-sm">
            <span className="text-primary num">0{i + 1}</span>
            <span className="text-foreground/90">{b}</span>
          </li>
        ))}
      </ul>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border">
        <Stat label="Ask" value={fmtCurrency(suggestedRaise)} />
        <Stat label="Use" value="Product + GTM" />
        <Stat label="Runway" value={`${assumptions.months} mo`} />
        <Stat label="Milestone" value={`${fmtCurrency(k.arr)} ARR`} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{label}</div>
      <div className="num text-sm mt-1">{value}</div>
    </div>
  );
}
