import type { RefObject } from "react";
import { RotateCcw } from "lucide-react";
import type { Assumptions, MonthRow, PricingTier } from "@/lib/forecast";
import { computeKPIs, fmtCurrency, fmtNumber } from "@/lib/forecast";
import { ExportButtons } from "./ExportButtons";
import { EditableText } from "./EditableText";

export type VCOverrides = {
  headline?: string;
  bullets?: string[];
};

type Props = {
  rows: MonthRow[];
  tiers: PricingTier[];
  assumptions: Assumptions;
  chartRef: RefObject<HTMLDivElement | null>;
  overrides: VCOverrides;
  onOverridesChange: (next: VCOverrides) => void;
};

export function VCSummary({ rows, tiers, assumptions, chartRef, overrides, onOverridesChange }: Props) {
  const k = computeKPIs(rows, assumptions);
  const askMultiple = 2;
  const suggestedRaise = Math.max(0, -k.peakBurn) * askMultiple || 250_000;

  const pricingLine = tiers
    .filter((t) => t.mixPct > 0 || t.type === "free")
    .map((t) => `${t.name} ($${t.price}${t.type === "subscription" ? "/mo" : t.type === "consumable" ? "/refill" : t.type === "free" ? " free" : " once"})`)
    .join(" · ");

  const defaultHeadline = `An AI product on a ${pricingLine || "tiered"} model, projecting ${fmtCurrency(k.arr)} ARR in ${assumptions.months} months.`;
  const defaultBullets = [
    `Reaches ${fmtCurrency(k.arr)} ARR by month ${assumptions.months} with ${fmtNumber(k.activePaid)} paying customers.`,
    `LTV/CAC of ${k.ltvCac.toFixed(2)}x — ${k.ltvCac >= 3 ? "healthy unit economics" : "needs to improve before scaling spend"}.`,
    `${k.breakEven ? `Breaks even on month ${k.breakEven}.` : "Does not reach monthly break-even in horizon — extend or cut costs."}`,
    `Peak cash need: ${fmtCurrency(Math.abs(k.peakBurn))}. Suggested raise: ${fmtCurrency(suggestedRaise)} (≈2x peak burn).`,
  ];

  const headline = overrides.headline ?? defaultHeadline;
  const bullets = overrides.bullets ?? defaultBullets;
  const hasOverride = overrides.headline !== undefined || overrides.bullets !== undefined;

  const setBullet = (i: number, v: string) => {
    const next = [...bullets];
    next[i] = v;
    onOverridesChange({ ...overrides, bullets: next });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-[260px]">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            The pitch
            <span className="text-[9px] tracking-normal text-muted-foreground/70 normal-case">· click any text to edit</span>
          </div>
          <EditableText
            as="h3"
            value={headline}
            onChange={(v) => onOverridesChange({ ...overrides, headline: v })}
            className="font-display text-2xl mt-1 max-w-2xl"
            multiline
          />
        </div>
        <ExportButtons
          rows={rows} tiers={tiers} assumptions={assumptions} chartRef={chartRef}
          headlineOverride={overrides.headline}
          bulletsOverride={overrides.bullets}
        />
      </div>

      <ul className="space-y-2">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-3 text-sm">
            <span className="text-primary num shrink-0">0{i + 1}</span>
            <EditableText
              value={b}
              onChange={(v) => setBullet(i, v)}
              className="text-foreground/90 flex-1"
              multiline
            />
          </li>
        ))}
      </ul>

      {hasOverride && (
        <button
          onClick={() => onOverridesChange({})}
          className="text-[11px] text-muted-foreground hover:text-primary inline-flex items-center gap-1"
        >
          <RotateCcw className="h-3 w-3" /> Reset to auto-generated
        </button>
      )}

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
