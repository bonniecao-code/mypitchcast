import type { RefObject } from "react";
import { RotateCcw, Plus, X } from "lucide-react";
import type { Assumptions, MonthRow, PricingTier } from "@/lib/forecast";
import { ExportButtons } from "./ExportButtons";
import { EditableText } from "./EditableText";
import type { ResolvedPitch } from "@/hooks/usePitchDraft";

type Props = {
  rows: MonthRow[];
  tiers: PricingTier[];
  assumptions: Assumptions;
  chartRef: RefObject<HTMLDivElement | null>;
  pitch: ResolvedPitch;
  onCompanyName: (v: string) => void;
  onHeadline: (v: string) => void;
  onBullet: (idx: number, v: string) => void;
  onAddBullet: () => void;
  onRemoveBullet: (idx: number) => void;
  onAsk: (v: string) => void;
  onUse: (v: string) => void;
  onRunway: (v: string) => void;
  onMilestone: (v: string) => void;
  onReset: () => void;
};

export function VCSummary({
  rows, tiers, assumptions, chartRef, pitch,
  onCompanyName, onHeadline, onBullet, onAddBullet, onRemoveBullet,
  onAsk, onUse, onRunway, onMilestone, onReset,
}: Props) {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">The pitch · click anything to edit</div>
          <EditableText
            value={pitch.companyName}
            onChange={onCompanyName}
            placeholder="Your AI startup"
            maxLength={80}
            ariaLabel="Company name"
            className="font-display text-lg mt-2 text-primary"
          />
          <EditableText
            value={pitch.headline}
            onChange={onHeadline}
            placeholder="One-line pitch headline"
            multiline
            maxLength={280}
            ariaLabel="Pitch headline"
            className="font-display text-2xl mt-1 max-w-2xl"
          />
        </div>
        <div className="flex flex-col items-end gap-2">
          <ExportButtons
            rows={rows} tiers={tiers} assumptions={assumptions} chartRef={chartRef} pitch={pitch}
          />
          <button
            onClick={onReset}
            className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <RotateCcw className="h-3 w-3" /> Reset to auto
          </button>
        </div>
      </div>

      <ul className="space-y-2">
        {pitch.bullets.map((b, i) => (
          <li key={i} className="flex gap-3 text-sm group items-start">
            <span className="text-primary num shrink-0 mt-0.5">0{i + 1}</span>
            <EditableText
              value={b}
              onChange={(v) => onBullet(i, v)}
              multiline
              maxLength={280}
              className="flex-1 text-foreground/90"
            />
            {pitch.bullets.length > 2 && (
              <button
                onClick={() => onRemoveBullet(i)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition"
                aria-label="Remove bullet"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </li>
        ))}
        {pitch.bullets.length < 6 && (
          <li>
            <button
              onClick={onAddBullet}
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
            >
              <Plus className="h-3 w-3" /> Add bullet
            </button>
          </li>
        )}
      </ul>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border">
        <Stat label="Ask" value={pitch.ask} onChange={onAsk} />
        <Stat label="Use" value={pitch.use} onChange={onUse} />
        <Stat label="Runway" value={pitch.runway} onChange={onRunway} />
        <Stat label="Milestone" value={pitch.milestone} onChange={onMilestone} />
      </div>
    </div>
  );
}

function Stat({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{label}</div>
      <EditableText value={value} onChange={onChange} maxLength={40} className="num text-sm mt-1" />
    </div>
  );
}
