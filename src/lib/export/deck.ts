import type { Assumptions, MonthRow, PricingTier } from "@/lib/forecast";
import { computeKPIs, fmtCurrency, fmtNumber } from "@/lib/forecast";

// Pitchcast brand palette (hex, for PPTX/PDF — CSS vars aren't available here)
export const brand = {
  bg: "1A1108",         // deep cocoa
  card: "26190E",
  text: "F5EFE6",
  muted: "A89684",
  primary: "E07A2B",    // amber/orange
  accent: "3FB8A3",     // teal forecast
  border: "3A2A1A",
};

export type DeckData = {
  companyName: string;
  cover: {
    tagline: string;
    arrHeadline: string;
    monthsHorizon: number;
  };
  pitch: {
    headline: string;
    bullets: string[];
  };
  metrics: { label: string; value: string; hint?: string }[];
  forecast: {
    chartPng?: string; // data URL
    stats: { label: string; value: string }[];
  };
};

export function buildDeck(
  rows: MonthRow[],
  tiers: PricingTier[],
  assumptions: Assumptions,
  chartPng?: string,
  companyName = "Your AI startup"
): DeckData {
  const k = computeKPIs(rows, assumptions);
  const suggestedRaise = Math.max(0, -k.peakBurn) * 2 || 250_000;

  const pricingLine = tiers
    .filter((t) => t.mixPct > 0 || t.type === "free")
    .map((t) =>
      `${t.name} ($${t.price}${
        t.type === "subscription" ? "/mo"
        : t.type === "consumable" ? "/refill"
        : t.type === "free" ? " free"
        : " once"
      })`
    )
    .join(" · ");

  return {
    companyName,
    cover: {
      tagline: "Forecast · Model · Fundraise",
      arrHeadline: `${fmtCurrency(k.arr)} ARR projected by month ${assumptions.months}`,
      monthsHorizon: assumptions.months,
    },
    pitch: {
      headline: `An AI product on a ${pricingLine || "tiered"} model, projecting ${fmtCurrency(k.arr)} ARR in ${assumptions.months} months.`,
      bullets: [
        `Reaches ${fmtCurrency(k.arr)} ARR by month ${assumptions.months} with ${fmtNumber(k.activePaid)} paying customers.`,
        `LTV/CAC of ${k.ltvCac.toFixed(2)}x — ${k.ltvCac >= 3 ? "healthy unit economics." : "needs to improve before scaling spend."}`,
        k.breakEven ? `Breaks even on month ${k.breakEven}.` : "Does not reach monthly break-even in horizon — extend or cut costs.",
        `Peak cash need: ${fmtCurrency(Math.abs(k.peakBurn))}. Suggested raise: ${fmtCurrency(suggestedRaise)} (≈2× peak burn).`,
      ],
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
        { label: "Ask", value: fmtCurrency(suggestedRaise) },
        { label: "Use", value: "Product + GTM" },
        { label: "Runway", value: `${assumptions.months} mo` },
        { label: "Milestone", value: `${fmtCurrency(k.arr)} ARR` },
      ],
    },
  };
}
