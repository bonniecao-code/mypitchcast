"use client";

import { Info, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Term } from "./Term";
import { fmtCurrency } from "@/lib/forecast";

export type ExitWaterfall = {
  salePrice: number;
  invested: number;
  investorPct: number;
  participating: boolean;
};

export const defaultExitWaterfall: ExitWaterfall = {
  salePrice: 10_000_000,
  invested: 2_000_000,
  investorPct: 20,
  participating: false,
};

type Props = {
  value: ExitWaterfall;
  onChange: (next: ExitWaterfall) => void;
  onReset: () => void;
};

export function ExitWaterfallPanel({ value, onChange, onReset }: Props) {
  const set = <K extends keyof ExitWaterfall>(k: K, v: ExitWaterfall[K]) =>
    onChange({ ...value, [k]: v });

  const sp = Math.max(0, value.salePrice);
  const inv = Math.max(0, value.invested);
  const pct = Math.min(100, Math.max(0, value.investorPct));

  // Non-participating: investor gets BETTER of (1) 1x preference back
  // or (2) converting to common and taking their % of sale price
  const nonPartInvestor = Math.max(inv, (pct / 100) * sp);
  const nonPartFounder = Math.max(0, sp - nonPartInvestor);

  // Participating: investor gets 1x preference back FIRST, then also
  // participates in remaining proceeds pro-rata
  const partInvestor = inv + (pct / 100) * Math.max(0, sp - inv);
  const partFounder = Math.max(0, sp - partInvestor);

  function barPct(amount: number, total: number) {
    return total > 0 ? (amount / total) * 100 : 0;
  }

  return (
    <div className="space-y-6">
      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground flex justify-between">
            <Term term="sale-price">Sale price</Term>
            <span className="text-muted-foreground/70">$</span>
          </Label>
          <Input
            type="number"
            min={0}
            className="num"
            value={value.salePrice}
            onChange={(e) => set("salePrice", Math.max(0, Number(e.target.value)))}
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground flex justify-between">
            <Term term="invested-amount">Invested amount</Term>
            <span className="text-muted-foreground/70">$</span>
          </Label>
          <Input
            type="number"
            min={0}
            className="num"
            value={value.invested}
            onChange={(e) => set("invested", Math.max(0, Number(e.target.value)))}
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground flex justify-between">
            <Term term="investor-ownership">Investor ownership</Term>
            <span className="text-muted-foreground/70">%</span>
          </Label>
          <div className="flex items-center gap-3 mt-2">
            <Slider
              value={[pct]}
              min={0}
              max={100}
              step={0.5}
              onValueChange={([v]) => set("investorPct", v)}
              className="flex-1"
            />
            <Input
              type="number"
              min={0}
              max={100}
              step={0.5}
              className="num w-20"
              value={pct}
              onChange={(e) =>
                set("investorPct", Math.min(100, Math.max(0, Number(e.target.value))))
              }
            />
          </div>
        </div>
      </div>

      {/* Preference toggle */}
      <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
        <Label className="text-xs text-muted-foreground mb-0">
          <Term term="liquidation-preference">Liquidation preference</Term>
        </Label>
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => set("participating", false)}
            className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
              !value.participating
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            Non-participating
          </button>
          <button
            onClick={() => set("participating", true)}
            className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
              value.participating
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            Participating
          </button>
        </div>
      </div>

      {/* Two-bar chart */}
      <div className="space-y-5">
        {/* Non-participating bar */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="font-medium text-foreground">Non-participating (1x)</span>
            <span className="text-muted-foreground">
              Investor {fmtCurrency(nonPartInvestor)} · Founder {fmtCurrency(nonPartFounder)}
            </span>
          </div>
          <div className="flex h-8 w-full overflow-hidden rounded-md border border-border">
            <Segment
              pct={barPct(nonPartInvestor, sp)}
              className="bg-secondary text-secondary-foreground"
              label="Investor"
              amount={nonPartInvestor}
            />
            <Segment
              pct={barPct(nonPartFounder, sp)}
              className="bg-primary text-primary-foreground"
              label="Founder"
              amount={nonPartFounder}
            />
          </div>
          <div className="flex justify-between mt-1 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            <span>Investor {barPct(nonPartInvestor, sp).toFixed(1)}%</span>
            <span>Founder {barPct(nonPartFounder, sp).toFixed(1)}%</span>
          </div>
        </div>

        {/* Participating bar */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="font-medium text-foreground">Participating (1x + share)</span>
            <span className="text-muted-foreground">
              Investor {fmtCurrency(partInvestor)} · Founder {fmtCurrency(partFounder)}
            </span>
          </div>
          <div className="flex h-8 w-full overflow-hidden rounded-md border border-border">
            <Segment
              pct={barPct(partInvestor, sp)}
              className="bg-destructive text-destructive-foreground"
              label="Investor"
              amount={partInvestor}
            />
            <Segment
              pct={barPct(partFounder, sp)}
              className="bg-primary text-primary-foreground"
              label="Founder"
              amount={partFounder}
            />
          </div>
          <div className="flex justify-between mt-1 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            <span>Investor {barPct(partInvestor, sp).toFixed(1)}%</span>
            <span>Founder {barPct(partFounder, sp).toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Difference callout */}
      <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 flex gap-3">
        <Info className="h-4 w-4 text-warning shrink-0 mt-0.5" />
        <div className="text-xs text-foreground/90 leading-relaxed">
          <div className="font-display text-sm text-warning mb-1">
            The participating preference bites twice
          </div>
          Non-participating lets the investor choose their 1x money back or convert to common — whichever is better. Participating gives them their 1x back AND a share of what is left, so they double-dip at the founder&apos;s expense. At a $10M sale with $2M invested and 20% ownership, participating takes an extra $1.6M out of the founder&apos;s pocket.
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onReset}
          className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          <RotateCcw className="h-3 w-3" /> Reset
        </button>
      </div>
    </div>
  );
}

function Segment({
  pct,
  className,
  label,
  amount,
}: {
  pct: number;
  className: string;
  label: string;
  amount: number;
}) {
  if (pct <= 0) return null;
  return (
    <div
      className={`flex items-center justify-center text-[10px] font-medium ${className}`}
      style={{ width: `${pct}%` }}
      title={`${label} ${fmtCurrency(amount)} (${pct.toFixed(1)}%)`}
    >
      {pct >= 8 ? `${pct.toFixed(0)}%` : ""}
    </div>
  );
}
