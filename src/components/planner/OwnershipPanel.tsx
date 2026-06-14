import { Info, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Term } from "./Term";
import { fmtCurrency } from "@/lib/forecast";

export type Ownership = {
  raise: number;
  preMoney: number;
  optionPoolPct: number;
};

export const defaultOwnership: Ownership = {
  raise: 500_000,
  preMoney: 2_000_000,
  optionPoolPct: 10,
};

type Props = {
  value: Ownership;
  onChange: (next: Ownership) => void;
  onReset: () => void;
};

export function OwnershipPanel({ value, onChange, onReset }: Props) {
  const postMoney = Math.max(0, value.preMoney + value.raise);
  const investorPct = postMoney > 0 ? (value.raise / postMoney) * 100 : 0;
  const poolPct = Math.min(20, Math.max(0, value.optionPoolPct));
  const founderPct = Math.max(0, 100 - investorPct - poolPct);

  const set = <K extends keyof Ownership>(k: K, v: Ownership[K]) =>
    onChange({ ...value, [k]: v });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground flex justify-between">
            <Term term="raise-amount">Raise amount</Term>
            <span className="text-muted-foreground/70">$</span>
          </Label>
          <Input
            type="number"
            min={0}
            className="num"
            value={value.raise}
            onChange={(e) => set("raise", Math.max(0, Number(e.target.value)))}
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground flex justify-between">
            <Term term="pre-money">Pre-money valuation</Term>
            <span className="text-muted-foreground/70">$</span>
          </Label>
          <Input
            type="number"
            min={0}
            className="num"
            value={value.preMoney}
            onChange={(e) => set("preMoney", Math.max(0, Number(e.target.value)))}
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground flex justify-between">
            <Term term="option-pool">Option pool</Term>
            <span className="text-muted-foreground/70">% (0–20)</span>
          </Label>
          <div className="flex items-center gap-3 mt-2">
            <Slider
              value={[poolPct]}
              min={0}
              max={20}
              step={0.5}
              onValueChange={([v]) => set("optionPoolPct", v)}
              className="flex-1"
            />
            <Input
              type="number"
              min={0}
              max={20}
              step={0.5}
              className="num w-20"
              value={poolPct}
              onChange={(e) =>
                set("optionPoolPct", Math.min(20, Math.max(0, Number(e.target.value))))
              }
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Post-money" term="post-money" value={fmtCurrency(postMoney)} />
        <Stat label="Investor" term="investor-pct" value={`${investorPct.toFixed(1)}%`} />
        <Stat label="Founder" term="founder-pct" value={`${founderPct.toFixed(1)}%`} />
        <Stat label="Option pool" term="option-pool" value={`${poolPct.toFixed(1)}%`} />
      </div>

      <div>
        <div className="flex h-8 w-full overflow-hidden rounded-md border border-border">
          <Segment pct={founderPct} className="bg-primary text-primary-foreground" label="Founder" />
          <Segment pct={investorPct} className="bg-secondary text-secondary-foreground" label="Investor" />
          <Segment pct={poolPct} className="bg-muted text-foreground" label="Pool" />
        </div>
        <div className="flex justify-between mt-2 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
          <span>Founder {founderPct.toFixed(1)}%</span>
          <span>Investor {investorPct.toFixed(1)}%</span>
          <span>Pool {poolPct.toFixed(1)}%</span>
        </div>
      </div>

      <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 flex gap-3">
        <Info className="h-4 w-4 text-warning shrink-0 mt-0.5" />
        <div className="text-xs text-foreground/90 leading-relaxed">
          <div className="font-display text-sm text-warning mb-1">The option pool trap</div>
          The option pool is carved out of the <strong>pre-money</strong>, so it dilutes
          the founder — not the investor. Example: an investor buying 20% with a 10%
          new pool brings the founder from 100% down to <strong>70%</strong>, not 80%.
          Negotiate pool size carefully — every extra point comes straight out of your stake.
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

function Stat({ label, value, term }: { label: string; value: string; term?: any }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
        {term ? <Term term={term}>{label}</Term> : label}
      </div>
      <div className="mt-1 font-display text-xl num">{value}</div>
    </div>
  );
}

function Segment({ pct, className, label }: { pct: number; className: string; label: string }) {
  if (pct <= 0) return null;
  return (
    <div
      className={`flex items-center justify-center text-[10px] font-medium ${className}`}
      style={{ width: `${pct}%` }}
      title={`${label} ${pct.toFixed(1)}%`}
    >
      {pct >= 8 ? `${pct.toFixed(0)}%` : ""}
    </div>
  );
}
