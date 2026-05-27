import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  description: z.string().min(5).max(4000),
});

export type Recommendation = {
  summary: string;
  pitchHeadline: string;
  pitchBullets: string[];
  recommendedTiers: {
    name: string;
    type: "free" | "subscription" | "one_time" | "physical" | "consumable";
    price: number;
    mixPct: number;
    cogs?: number;
    repurchasesPerMonth?: number;
  }[];
  assumptionOverrides: {
    startingVisitors?: number;
    visitorGrowthPct?: number;
    signupConvPct?: number;
    paidConvPct?: number;
    monthlyChurnPct?: number;
    cac?: number;
    fixedCostsMonthly?: number;
    variableCostPct?: number;
    months?: number;
  };
};

const SYSTEM = `You are a startup pricing & GTM strategist for solo AI founders.
Given a short product description, recommend:
- a blended business model using ONLY these tier types: free, subscription, one_time, physical, consumable.
- realistic price points, with mixPct across paid tiers summing to ~100.
- for "physical" or "consumable" tiers, include reasonable per-unit cogs (and repurchasesPerMonth for consumables, e.g. 0.3–2).
- assumption overrides (CAC, churn, conversion, fixed costs) that match the product category — hardware has higher CAC and COGS, prosumer SaaS has lower churn, etc.
- a punchy pitch headline and 4 numbered VC bullets (traction, unit economics, break-even path, ask).
Be opinionated. Always call the recommend_business_model tool. Do NOT reply in plain text.`;

export const recommendBusinessModel = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<{ recommendation?: Recommendation; error?: string }> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { error: "AI is not configured on this project." };

    const tool = {
      type: "function" as const,
      function: {
        name: "recommend_business_model",
        description: "Return a structured pricing + revenue model recommendation.",
        parameters: {
          type: "object",
          properties: {
            summary: { type: "string", description: "1-2 sentence reformulation of the product and its primary revenue mechanism." },
            pitchHeadline: { type: "string", description: "One-line VC pitch headline." },
            pitchBullets: {
              type: "array", minItems: 4, maxItems: 4,
              items: { type: "string" },
              description: "Exactly 4 short bullets: traction, unit economics, break-even, ask.",
            },
            recommendedTiers: {
              type: "array", minItems: 2, maxItems: 5,
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  type: { type: "string", enum: ["free", "subscription", "one_time", "physical", "consumable"] },
                  price: { type: "number" },
                  mixPct: { type: "number", description: "0-100; across paid tiers should sum ~100" },
                  cogs: { type: "number", description: "per-unit cost; required for physical/consumable" },
                  repurchasesPerMonth: { type: "number", description: "consumable only; avg reorders per active customer per month" },
                },
                required: ["name", "type", "price", "mixPct"],
                additionalProperties: false,
              },
            },
            assumptionOverrides: {
              type: "object",
              properties: {
                startingVisitors: { type: "number" },
                visitorGrowthPct: { type: "number" },
                signupConvPct: { type: "number" },
                paidConvPct: { type: "number" },
                monthlyChurnPct: { type: "number" },
                cac: { type: "number" },
                fixedCostsMonthly: { type: "number" },
                variableCostPct: { type: "number" },
                months: { type: "number" },
              },
              additionalProperties: false,
            },
          },
          required: ["summary", "pitchHeadline", "pitchBullets", "recommendedTiers", "assumptionOverrides"],
          additionalProperties: false,
        },
      },
    };

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM },
            { role: "user", content: data.description },
          ],
          tools: [tool],
          tool_choice: { type: "function", function: { name: "recommend_business_model" } },
        }),
      });

      if (res.status === 429) return { error: "Rate limit hit — please try again in a moment." };
      if (res.status === 402) return { error: "AI credits exhausted — please add funds in Settings → Workspace → Usage." };
      if (!res.ok) {
        const t = await res.text();
        console.error("AI gateway error", res.status, t);
        return { error: `AI service error (${res.status}).` };
      }

      const json = await res.json();
      const call = json.choices?.[0]?.message?.tool_calls?.[0];
      if (!call?.function?.arguments) return { error: "AI did not return a recommendation." };
      const parsed = JSON.parse(call.function.arguments) as Recommendation;
      return { recommendation: parsed };
    } catch (e) {
      console.error("recommendBusinessModel failed", e);
      return { error: "Couldn't reach the AI service." };
    }
  });
