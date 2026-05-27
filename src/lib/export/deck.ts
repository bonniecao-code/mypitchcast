import type { Assumptions, MonthRow, PricingTier } from "@/lib/forecast";
import { computeKPIs, fmtCurrency } from "@/lib/forecast";
import type { ResolvedPitch } from "@/hooks/usePitchDraft";

// Pitchcast brand palette (hex, for PPTX/PDF — CSS vars aren't available here)
export const brand = {
  bg: "1A1108",
  card: "26190E",
  text: "F5EFE6",
  muted: "A89684",
  primary: "E07A2B",
  accent: "3FB8A3",
  border: "3A2A1A",
};

export type DeckData = {
  companyName: string;
  cover: { tagline: string; arrHeadline: string; monthsHorizon: number };
  pitch: { headline: string; bullets: string[] };
  metrics: { label: string; value: string; hint?: string }[];
  forecast: {
    chartPng?: string;
    stats: { label: string; value: string }[];
  };
};

export function buildDeck(
  rows: MonthRow[],
  _tiers: PricingTier[],
  assumptions: Assumptions,
  chartPng: string | undefined,
  pitch: ResolvedPitch,
): DeckData {
  const k = computeKPIs(rows, assumptions);
  return {
    companyName: pitch.companyName,
    cover: {
      tagline: "Forecast · Model · Fundraise",
      arrHeadline: `${fmtCurrency(k.arr)} ARR projected by month ${assumptions.months}`,
      monthsHorizon: assumptions.months,
    },
    pitch: {
      headline: pitch.headline,
      bullets: pitch.bullets,
    },
    metrics: [
      { label: "MRR (final)", value: fmtCurrency(k.mrr), hint: `Month ${assumptions.months}` },
      { label: "ARR", value: fmtCurrency(k.arr) },
      { label: "LTV / CAC", value: `${k.ltvCac.toFixed(2)}x`, hint: "3x+ is healthy" },
      { label: "Break-even", value: k.breakEven ? `Mo ${k.breakEven}` : "—", hint: k.breakEven ? "First profitable month" : "Not in horizon" },
    ],
    forecast: {
      chartPng,
      stats: [
        { label: "Ask", value: pitch.ask },
        { label: "Use", value: pitch.use },
        { label: "Runway", value: pitch.runway },
        { label: "Milestone", value: pitch.milestone },
      ],
    },
  };
}
