import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Search, ArrowLeft, Shield, Banknote } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Term } from "@/components/planner/Term";
import logoIcon from "@/assets/pitchcast-icon.png";
import { cn } from "@/lib/utils";
import type { GlossaryKey } from "@/lib/glossary";

type BadgeType = "standard" | "negotiate" | "red-flag";

interface TermItem {
  id: string;
  name: string;
  definition: string;
  category: "economics" | "control";
  badge: BadgeType;
}

const termsSeed: TermItem[] = [
  {
    id: "pre-post-money",
    name: "Pre / post-money valuation",
    definition:
      "Pre-money is what your company is worth before the round. Post-money is pre + the new cash. Investors own raise ÷ post-money.",
    category: "economics",
    badge: "standard",
  },
  {
    id: "liquidation-preference",
    name: "Liquidation preference",
    definition:
      "Investors get their money back first in a sale. 1x is normal. 2x or 'participating preferred' means they double-dip — founders get far less.",
    category: "economics",
    badge: "negotiate",
  },
  {
    id: "anti-dilution",
    name: "Anti-dilution",
    definition:
      "Protects investors if you raise a future round at a lower price. 'Broad-based weighted average' is standard and fair. 'Full ratchet' resets their price entirely — brutal for founders.",
    category: "economics",
    badge: "negotiate",
  },
  {
    id: "pay-to-play",
    name: "Pay-to-play",
    definition:
      "In a down round, existing investors must put in more cash or lose preferred rights. Can align incentives, but punitive versions strip protections entirely.",
    category: "economics",
    badge: "negotiate",
  },
  {
    id: "option-pool",
    name: "Option pool",
    definition:
      "Shares reserved for future hires. Almost always carved from pre-money, meaning it dilutes you — not the new investor.",
    category: "economics",
    badge: "standard",
  },
  {
    id: "vesting",
    name: "Vesting",
    definition:
      "Founders earn their shares over time, typically 4 years with a 1-year cliff. If you leave early, unvested shares go back to the company.",
    category: "economics",
    badge: "standard",
  },
  {
    id: "conversion",
    name: "Conversion",
    definition:
      "When preferred shares turn into common shares, usually at an IPO or acquisition. Preferred investors only convert if the payout is better than their liquidation preference.",
    category: "economics",
    badge: "standard",
  },
  {
    id: "board-of-directors",
    name: "Board of directors",
    definition:
      "Who controls the company. A 2-founder + 1-investor board keeps you in charge. Losing the majority means you can be fired as CEO.",
    category: "control",
    badge: "negotiate",
  },
  {
    id: "protective-provisions",
    name: "Protective provisions",
    definition:
      "Investor veto rights over big decisions: selling the company, raising more money, changing the business, hiring/firing execs. Too many and you can't move fast.",
    category: "control",
    badge: "red-flag",
  },
  {
    id: "drag-along",
    name: "Drag-along",
    definition:
      "If a majority of shareholders want to sell the company, minority shareholders can be forced to join. Prevents one small investor from blocking a good exit.",
    category: "control",
    badge: "standard",
  },
];

function BadgePill({ type }: { type: BadgeType }) {
  const styles: Record<BadgeType, string> = {
    standard: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    negotiate: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    "red-flag": "bg-red-500/15 text-red-400 border-red-500/30",
  };
  const labels: Record<BadgeType, string> = {
    standard: "Standard",
    negotiate: "Negotiate",
    "red-flag": "Red flag",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        styles[type]
      )}
    >
      {labels[type]}
    </span>
  );
}

function TermCard({ term }: { term: TermItem }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 transition-colors hover:bg-secondary/30">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="font-display text-base font-medium mb-1">{term.name}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{term.definition}</p>
        </div>
        <div className="shrink-0 pt-0.5">
          <BadgePill type={term.badge} />
        </div>
      </div>
    </div>
  );
}

export function TermSheetDecoder() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("economics");

  const economics = useMemo(
    () => termsSeed.filter((t) => t.category === "economics"),
    []
  );
  const control = useMemo(
    () => termsSeed.filter((t) => t.category === "control"),
    []
  );

  const filteredEconomics = useMemo(
    () =>
      economics.filter(
        (t) =>
          t.name.toLowerCase().includes(query.toLowerCase()) ||
          t.definition.toLowerCase().includes(query.toLowerCase())
      ),
    [economics, query]
  );

  const filteredControl = useMemo(
    () =>
      control.filter(
        (t) =>
          t.name.toLowerCase().includes(query.toLowerCase()) ||
          t.definition.toLowerCase().includes(query.toLowerCase())
      ),
    [control, query]
  );

  const hasResults = filteredEconomics.length > 0 || filteredControl.length > 0;

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoIcon} alt="Pitchcast" className="h-9 w-9 rounded-lg" />
            <div>
              <div className="font-display text-xl leading-none font-semibold">
                pitch<span className="text-primary">cast</span>
              </div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mt-1.5">
                Forecast · Model · Fundraise
              </div>
            </div>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to planner
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-2">
          <h1 className="font-display text-4xl sm:text-5xl leading-[1.05]">
            Term Sheet Decoder
          </h1>
          <p className="text-muted-foreground mt-3 max-w-xl">
            Fundraising terms explained in plain English. Green = usually fine, Amber = read the fine print, Red = get a lawyer.
          </p>
        </div>

        <div className="mt-6 mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search terms..."
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-secondary">
            <TabsTrigger value="economics" className="gap-1.5">
              <Banknote className="h-3.5 w-3.5" />
              Economics
              <span className="ml-1 text-[10px] text-muted-foreground">
                ({filteredEconomics.length})
              </span>
            </TabsTrigger>
            <TabsTrigger value="control" className="gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              Control
              <span className="ml-1 text-[10px] text-muted-foreground">
                ({filteredControl.length})
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="economics" className="mt-4 space-y-3">
            {filteredEconomics.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No economics terms match "{query}"
              </div>
            ) : (
              filteredEconomics.map((term) => <TermCard key={term.id} term={term} />)
            )}
          </TabsContent>

          <TabsContent value="control" className="mt-4 space-y-3">
            {filteredControl.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No control terms match "{query}"
              </div>
            ) : (
              filteredControl.map((term) => <TermCard key={term.id} term={term} />)
            )}
          </TabsContent>
        </Tabs>

        {!hasResults && query && (
          <div className="text-center py-12 text-muted-foreground">
            No terms match "{query}"
          </div>
        )}
      </main>
    </div>
  );
}
