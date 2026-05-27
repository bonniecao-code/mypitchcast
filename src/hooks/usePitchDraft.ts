import { useCallback, useEffect, useMemo, useState } from "react";
import type { Assumptions, MonthRow, PricingTier } from "@/lib/forecast";
import { computeKPIs, fmtCurrency, fmtNumber } from "@/lib/forecast";

export type PitchSeed = {
  companyName?: string;
  oneLiner?: string;
  bullets?: string[];
  use?: string;
  milestone?: string;
};

export type PitchDraft = {
  companyName: string;
  // Each field is an override; null/undefined means "use auto-generated".
  headline?: string;
  bullets?: string[];
  ask?: string;
  use?: string;
  runway?: string;
  milestone?: string;
  // AI seed from the onboarding chat — used as the auto baseline when present.
  aiSeed?: PitchSeed;
};

export function autoPitch(
  rows: MonthRow[],
  tiers: PricingTier[],
  assumptions: Assumptions,
) {
  const k = computeKPIs(rows, assumptions);
  const suggestedRaise = Math.max(0, -k.peakBurn) * 2 || 250_000;
  const pricingLine = tiers
    .filter((t) => t.mixPct > 0 || t.type === "free")
    .map(
      (t) =>
        `${t.name} ($${t.price}${
          t.type === "subscription"
            ? "/mo"
            : t.type === "consumable"
            ? "/refill"
            : t.type === "free"
            ? " free"
            : " once"
        })`,
    )
    .join(" · ");

  const headline = `An AI product on a ${pricingLine || "tiered"} model, projecting ${fmtCurrency(k.arr)} ARR in ${assumptions.months} months.`;
  const bullets = [
    `Reaches ${fmtCurrency(k.arr)} ARR by month ${assumptions.months} with ${fmtNumber(k.activePaid)} paying customers.`,
    `LTV/CAC of ${k.ltvCac.toFixed(2)}x — ${k.ltvCac >= 3 ? "healthy unit economics." : "needs to improve before scaling spend."}`,
    k.breakEven
      ? `Breaks even on month ${k.breakEven}.`
      : "Does not reach monthly break-even in horizon — extend or cut costs.",
    `Peak cash need: ${fmtCurrency(Math.abs(k.peakBurn))}. Suggested raise: ${fmtCurrency(suggestedRaise)} (≈2× peak burn).`,
  ];

  return {
    headline,
    bullets,
    ask: fmtCurrency(suggestedRaise),
    use: "Product + GTM",
    runway: `${assumptions.months} mo`,
    milestone: `${fmtCurrency(k.arr)} ARR`,
    arr: k.arr,
  };
}

export type ResolvedPitch = ReturnType<typeof autoPitch> & {
  companyName: string;
  headline: string;
  bullets: string[];
  ask: string;
  use: string;
  runway: string;
  milestone: string;
};

export function usePitchDraft(
  rows: MonthRow[],
  tiers: PricingTier[],
  assumptions: Assumptions,
  initial: PitchDraft | undefined,
  onPersist: (next: PitchDraft) => void,
) {
  const [draft, setDraft] = useState<PitchDraft>(initial ?? { companyName: "Your AI startup" });

  // Persist whenever draft changes.
  useEffect(() => {
    onPersist(draft);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  const auto = useMemo(() => autoPitch(rows, tiers, assumptions), [rows, tiers, assumptions]);

  const resolved: ResolvedPitch = {
    ...auto,
    companyName: draft.companyName || "Your AI startup",
    headline: draft.headline ?? auto.headline,
    bullets: draft.bullets ?? auto.bullets,
    ask: draft.ask ?? auto.ask,
    use: draft.use ?? auto.use,
    runway: draft.runway ?? auto.runway,
    milestone: draft.milestone ?? auto.milestone,
  };

  const setField = useCallback(<K extends keyof PitchDraft>(k: K, v: PitchDraft[K]) => {
    setDraft((d) => ({ ...d, [k]: v }));
  }, []);

  const setBullet = useCallback((idx: number, text: string) => {
    setDraft((d) => {
      const current = d.bullets ?? auto.bullets;
      const next = [...current];
      next[idx] = text;
      return { ...d, bullets: next };
    });
  }, [auto.bullets]);

  const addBullet = useCallback(() => {
    setDraft((d) => {
      const current = d.bullets ?? auto.bullets;
      if (current.length >= 6) return d;
      return { ...d, bullets: [...current, "New bullet — click to edit."] };
    });
  }, [auto.bullets]);

  const removeBullet = useCallback((idx: number) => {
    setDraft((d) => {
      const current = d.bullets ?? auto.bullets;
      if (current.length <= 2) return d;
      return { ...d, bullets: current.filter((_, i) => i !== idx) };
    });
  }, [auto.bullets]);

  const resetToAuto = useCallback(() => {
    setDraft((d) => ({ companyName: d.companyName }));
  }, []);

  return { draft, resolved, auto, setField, setBullet, addBullet, removeBullet, resetToAuto };
}
