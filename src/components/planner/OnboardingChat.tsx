import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles, Send, Wand2, Layers } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { recommendBusinessModel, type Recommendation } from "@/lib/ai/recommendation.functions";

type Props = {
  initial?: Recommendation | null;
  onApplyAll: (rec: Recommendation) => void;
  onSuggestTab: (rec: Recommendation) => void;
};

const EXAMPLES = [
  "An AI coding copilot for solo indie devs, freemium SaaS with a pro tier.",
  "A bio-sensor wearable that ships a starter kit plus monthly sensor refills.",
  "An image generation API for marketing teams, usage-based with a free trial.",
];

export function OnboardingChat({ initial, onApplyAll, onSuggestTab }: Props) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [rec, setRec] = useState<Recommendation | null>(initial ?? null);
  const recommend = useServerFn(recommendBusinessModel);

  const submit = async (prompt?: string) => {
    const description = (prompt ?? text).trim();
    if (description.length < 5) {
      toast.error("Tell me a bit more about your product.");
      return;
    }
    setBusy(true);
    try {
      const res = await recommend({ data: { description } });
      if (res.error || !res.recommendation) {
        toast.error(res.error ?? "Couldn't get a recommendation.");
        return;
      }
      setRec(res.recommendation);
      toast.success("Got a recommendation — review below.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="p-6 sm:p-8 bg-gradient-to-br from-primary/10 via-card to-card">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-primary mb-3">
          <Sparkles className="h-3.5 w-3.5" /> Start here
        </div>
        <h1 className="font-display text-3xl sm:text-4xl leading-[1.1] max-w-2xl">
          Describe your product. <span className="text-muted-foreground">Get a pricing + pitch draft in seconds.</span>
        </h1>

        <div className="mt-5 space-y-3">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. An AI assistant that helps bio engineers design protein sequences. Solo founder, no funding yet, want recurring revenue but might sell custom one-off models too."
            rows={3}
            className="bg-background/60 resize-none"
            disabled={busy}
          />
          <div className="flex flex-wrap gap-2 items-center">
            <Button onClick={() => submit()} disabled={busy} className="gap-2">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {rec ? "Re-generate" : "Recommend my model"}
            </Button>
            <span className="text-xs text-muted-foreground">or try:</span>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => { setText(ex); submit(ex); }}
                disabled={busy}
                className="text-xs px-2.5 py-1 rounded-full border border-border hover:border-primary/60 hover:text-primary transition-colors disabled:opacity-50"
              >
                {ex.split(",")[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {rec && (
        <div className="border-t border-border p-6 sm:p-8 space-y-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">AI summary</div>
            <p className="text-sm mt-1 text-foreground/90">{rec.summary}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg border border-border p-3">
              <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2">Suggested tiers</div>
              <ul className="space-y-1.5 text-sm">
                {rec.recommendedTiers.map((t, i) => (
                  <li key={i} className="flex justify-between gap-2">
                    <span className="truncate">
                      <span className="text-foreground">{t.name}</span>{" "}
                      <span className="text-muted-foreground">· {t.type}</span>
                    </span>
                    <span className="num text-primary">${t.price} · {t.mixPct}%</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-border p-3">
              <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2">Pitch seed</div>
              <p className="text-sm font-medium text-foreground/95">{rec.pitchHeadline}</p>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground list-disc list-inside">
                {rec.pitchBullets.slice(0, 2).map((b, i) => <li key={i}>{b}</li>)}
              </ul>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button size="sm" onClick={() => onApplyAll(rec)} className="gap-2">
              <Wand2 className="h-4 w-4" /> Apply to my plan
            </Button>
            <Button size="sm" variant="outline" onClick={() => onSuggestTab(rec)} className="gap-2">
              <Layers className="h-4 w-4" /> Put in "AI suggested" tab
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
