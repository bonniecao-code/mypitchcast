import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles, Send, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { recommendModel } from "@/lib/ai/recommend.functions";
import type { Assumptions, PricingTier } from "@/lib/forecast";

type Msg = { role: "user" | "assistant"; content: string };

type PitchSeed = {
  companyName: string;
  oneLiner: string;
  bullets: string[];
  use: string;
  milestone: string;
};

type Recommendation = {
  summary: string;
  rationale?: string;
  tiers: Array<{
    name: string;
    type: PricingTier["type"];
    price: number;
    mixPct: number;
    cogs?: number;
    repurchasesPerMonth?: number;
  }>;
  assumptions: Partial<Assumptions>;
  pitch?: PitchSeed;
};

type Props = {
  onApply: (tiers: PricingTier[], assumptions: Partial<Assumptions>, pitch?: PitchSeed) => void;
};

const OPENER: Msg = {
  role: "assistant",
  content:
    "Hi! Tell me about your product and how you plan to make money. " +
    "For example: \"AI tutor for high-schoolers, freemium with a $15/mo Pro plan\" — " +
    "or \"AI-designed biomaterial dressings, sold as a starter kit + refills.\"",
};

export function OnboardingChat({ onApply }: Props) {
  const [open, setOpen] = useState(true);
  const [messages, setMessages] = useState<Msg[]>([OPENER]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [rec, setRec] = useState<Recommendation | null>(null);
  const [applyTiers, setApplyTiers] = useState(true);
  const [applyAssumptions, setApplyAssumptions] = useState(true);

  const recommend = useServerFn(recommendModel);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    setRec(null);
    try {
      // Only send user/assistant messages (excluding the canned opener) to the model.
      const payload = next.filter((m, i) => !(i === 0 && m === OPENER));
      const res = await recommend({ data: { messages: payload } });
      if (!res.ok) {
        setMessages((m) => [...m, { role: "assistant", content: `⚠️ ${res.error}` }]);
        toast.error(res.error);
        return;
      }
      const r = res.recommendation as Recommendation;
      setRec(r);
      const lines = [
        r.summary,
        ...(r.rationale ? [r.rationale] : []),
        "I drafted a pricing model and starter assumptions below — review and click Apply.",
      ];
      setMessages((m) => [...m, { role: "assistant", content: lines.join("\n\n") }]);
    } catch (e) {
      console.error(e);
      toast.error("Couldn't reach the AI advisor.");
    } finally {
      setLoading(false);
    }
  };

  const apply = () => {
    if (!rec) return;
    const tiers: PricingTier[] = rec.tiers.map((t, i) => ({
      id: `ai-${i + 1}`,
      name: t.name,
      type: t.type,
      price: t.price,
      mixPct: t.mixPct,
      ...(t.cogs !== undefined ? { cogs: t.cogs } : {}),
      ...(t.repurchasesPerMonth !== undefined ? { repurchasesPerMonth: t.repurchasesPerMonth } : {}),
    }));
    onApply(applyTiers ? tiers : [], applyAssumptions ? rec.assumptions : {});
    toast.success("Applied to your model");
    setOpen(false);
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/15 grid place-items-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="font-display text-lg">Start with AI</div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              Describe your product · get a recommended pricing model
            </div>
          </div>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4">
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user"
                    ? "ml-auto max-w-[85%] bg-primary/15 text-foreground rounded-2xl rounded-tr-sm px-3 py-2 text-sm whitespace-pre-wrap"
                    : "mr-auto max-w-[85%] bg-secondary text-foreground rounded-2xl rounded-tl-sm px-3 py-2 text-sm whitespace-pre-wrap"
                }
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="mr-auto max-w-[85%] bg-secondary rounded-2xl rounded-tl-sm px-3 py-2 text-sm flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Thinking through your model…
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. AI-designed wound dressings sold as starter kit + monthly refills"
              disabled={loading}
              maxLength={1000}
            />
            <Button type="submit" size="sm" disabled={loading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>

          {rec && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
              <div className="text-[10px] uppercase tracking-[0.15em] text-primary">Recommendation</div>

              <div>
                <div className="text-xs text-muted-foreground mb-1">Pricing tiers</div>
                <div className="space-y-1">
                  {rec.tiers.map((t, i) => (
                    <div key={i} className="text-sm flex items-center justify-between gap-2 border-b border-border/50 py-1">
                      <span className="font-medium">{t.name}</span>
                      <span className="text-muted-foreground text-xs">
                        {t.type} · ${t.price}
                        {t.cogs !== undefined ? ` · cogs $${t.cogs}` : ""}
                        {t.repurchasesPerMonth !== undefined ? ` · ${t.repurchasesPerMonth}/mo` : ""}
                      </span>
                      <span className="num text-sm w-12 text-right">{t.mixPct}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {rec.assumptions && Object.keys(rec.assumptions).length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Starter assumptions</div>
                  <div className="text-xs num grid grid-cols-2 gap-x-4 gap-y-1">
                    {Object.entries(rec.assumptions).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-muted-foreground">{k}</span>
                        <span>{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-border">
                <label className="text-xs flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={applyTiers} onChange={(e) => setApplyTiers(e.target.checked)} />
                  Replace pricing tiers
                </label>
                <label className="text-xs flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={applyAssumptions} onChange={(e) => setApplyAssumptions(e.target.checked)} />
                  Apply assumptions
                </label>
                <Button size="sm" className="ml-auto" onClick={apply} disabled={!applyTiers && !applyAssumptions}>
                  Apply to my model
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
