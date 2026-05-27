import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const InputSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(20),
});

const TIER_TYPES = ["free", "subscription", "one_time", "physical", "consumable"] as const;

const SYSTEM_PROMPT = `You are a pricing & business-model advisor AND VC pitch coach for solo AI founders.
Given a short description of the product and how the founder plans to make money, recommend:
  1. A concise summary of the recommended business model (1-2 sentences).
  2. 2 to 4 pricing tiers. Pick tier types from: free, subscription, one_time, physical, consumable.
     - subscription = recurring monthly SaaS (price is $/month).
     - one_time = lifetime license, course, ebook (price is one-time $).
     - physical = one-shipment hardware/biomaterial (include cogs = per-unit cost).
     - consumable = recurring physical reorders (include cogs and repurchasesPerMonth, e.g. 0.5 = every 2 months).
     - free = $0, used as a lead-gen tier.
     mixPct across all tiers should sum to ~100.
  3. Starter assumptions that fit the model (visitors, conversion, churn, CAC, costs).
  4. A tailored VC pitch (pitch object) that references the ACTUAL product nouns from the founder's description — never say "Your AI startup" or generic placeholders. Include:
     - companyName: short, brandable suggested name derived from the product (2-3 words max).
     - oneLiner: sharp headline like "<Product> is a <category> that <core value> for <audience>."
     - bullets: 3-4 punchy VC bullets covering (a) wedge / why-now, (b) GTM motion, (c) moat or differentiator, (d) next milestone. Each under 160 chars. Do NOT invent revenue numbers — the app fills unit economics from the live forecast.
     - use: 2-4 word phrase for use of funds (e.g. "Lab pilots + GTM").
     - milestone: 2-6 word phrase for next funding milestone (e.g. "10 paid pilots", "FDA pre-submission").
Be opinionated and concrete. Lean into physical/consumable tiers for biomaterials/hardware; blend models when unsure.`;

export const recommendModel = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "AI is not configured for this project." };
    }

    const body = {
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...data.messages,
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "recommend_business_model",
            description: "Return a recommended pricing model and starter assumptions for the founder.",
            parameters: {
              type: "object",
              properties: {
                summary: {
                  type: "string",
                  description: "1-2 sentence plain-English summary of the recommended business model.",
                },
                rationale: {
                  type: "string",
                  description: "Short reasoning (2-3 sentences) explaining why this model fits the product.",
                },
                tiers: {
                  type: "array",
                  minItems: 2,
                  maxItems: 4,
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      type: { type: "string", enum: TIER_TYPES as unknown as string[] },
                      price: { type: "number", minimum: 0 },
                      mixPct: { type: "number", minimum: 0, maximum: 100 },
                      cogs: { type: "number", minimum: 0 },
                      repurchasesPerMonth: { type: "number", minimum: 0 },
                    },
                    required: ["name", "type", "price", "mixPct"],
                    additionalProperties: false,
                  },
                },
                assumptions: {
                  type: "object",
                  properties: {
                    startingVisitors: { type: "number", minimum: 0 },
                    visitorGrowthPct: { type: "number" },
                    signupConvPct: { type: "number", minimum: 0, maximum: 100 },
                    paidConvPct: { type: "number", minimum: 0, maximum: 100 },
                    monthlyChurnPct: { type: "number", minimum: 0, maximum: 100 },
                    cac: { type: "number", minimum: 0 },
                    fixedCostsMonthly: { type: "number", minimum: 0 },
                    variableCostPct: { type: "number", minimum: 0, maximum: 100 },
                  },
                  additionalProperties: false,
                },
                pitch: {
                  type: "object",
                  properties: {
                    companyName: { type: "string" },
                    oneLiner: { type: "string" },
                    bullets: {
                      type: "array",
                      minItems: 3,
                      maxItems: 4,
                      items: { type: "string" },
                    },
                    use: { type: "string" },
                    milestone: { type: "string" },
                  },
                  required: ["companyName", "oneLiner", "bullets", "use", "milestone"],
                  additionalProperties: false,
                },
              },
              required: ["summary", "tiers", "assumptions", "pitch"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "recommend_business_model" } },
    };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (res.status === 429) {
      return { ok: false as const, error: "Rate limit hit — please wait a moment and try again." };
    }
    if (res.status === 402) {
      return { ok: false as const, error: "AI credits exhausted. Add credits in Settings → Workspace → Usage." };
    }
    if (!res.ok) {
      const txt = await res.text();
      console.error("Lovable AI error", res.status, txt);
      return { ok: false as const, error: "The AI couldn't respond right now." };
    }

    const json = await res.json();
    const call = json?.choices?.[0]?.message?.tool_calls?.[0];
    const argsStr = call?.function?.arguments;
    if (!argsStr) {
      return { ok: false as const, error: "AI returned no recommendation. Try adding more detail." };
    }
    try {
      const parsed = JSON.parse(argsStr);
      return { ok: true as const, recommendation: parsed };
    } catch (e) {
      console.error("Failed to parse tool args", e, argsStr);
      return { ok: false as const, error: "AI response was malformed." };
    }
  });
