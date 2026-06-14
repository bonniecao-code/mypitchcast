import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Download, RotateCcw, BookOpen } from "lucide-react";
import logoIcon from "@/assets/pitchcast-icon.png";
import {
  defaultAssumptions, defaultTiers, runForecast, computeKPIs,
  fmtCurrency, fmtNumber,
  type Assumptions, type PricingTier,
} from "@/lib/forecast";
import { PricingBuilder } from "@/components/planner/PricingBuilder";
import { AssumptionsPanel } from "@/components/planner/AssumptionsPanel";
import { RevenueChart, CashflowChart, CustomersChart } from "@/components/planner/ForecastCharts";
import { KPICard } from "@/components/planner/KPICard";
import { VCSummary } from "@/components/planner/VCSummary";
import { OnboardingChat } from "@/components/planner/OnboardingChat";
import { OwnershipPanel, defaultOwnership, type Ownership } from "@/components/planner/OwnershipPanel";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Term } from "@/components/planner/Term";
import { usePitchDraft, type PitchDraft } from "@/hooks/usePitchDraft";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pitchcast — Forecast. Model. Fundraise." },
      { name: "description", content: "Model pricing, forecast revenue, and generate VC-ready summaries for your AI startup." },
    ],
  }),
  component: Index,
});

const STORAGE_KEY = "pitchcast.v1";

function Index() {
  const [tiers, setTiers] = useState<PricingTier[]>(defaultTiers);
  const [assumptions, setAssumptions] = useState<Assumptions>(defaultAssumptions);
  const [ownership, setOwnership] = useState<Ownership>(defaultOwnership);
  const [initialPitch, setInitialPitch] = useState<PitchDraft | undefined>(undefined);
  const [loaded, setLoaded] = useState(false);
  const exportChartRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (p.tiers) setTiers(p.tiers);
        if (p.assumptions) setAssumptions(p.assumptions);
        if (p.pitch) setInitialPitch(p.pitch);
        if (p.ownership) setOwnership({ ...defaultOwnership, ...p.ownership });
      }
    } catch {}
    setLoaded(true);
  }, []);

  const rows = useMemo(() => runForecast(tiers, assumptions), [tiers, assumptions]);
  const k = useMemo(() => computeKPIs(rows, assumptions), [rows, assumptions]);

  const pitchApi = usePitchDraft(rows, tiers, assumptions, initialPitch, (next) => {
    if (!loaded) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const prev = raw ? JSON.parse(raw) : {};
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prev, tiers, assumptions, pitch: next, ownership }));
    } catch {}
  });

  useEffect(() => {
    if (!loaded) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const prev = raw ? JSON.parse(raw) : {};
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prev, tiers, assumptions, ownership }));
    } catch {}
  }, [tiers, assumptions, ownership, loaded]);

  const reset = () => {
    setTiers(defaultTiers);
    setAssumptions(defaultAssumptions);
    setOwnership(defaultOwnership);
    pitchApi.resetToAuto();
  };


  const applyAiRecommendation = (
    newTiers: PricingTier[],
    newAssumptions: Partial<Assumptions>,
    pitchSeed?: { companyName: string; oneLiner: string; bullets: string[]; use: string; milestone: string },
  ) => {
    if (newTiers.length) setTiers(newTiers);
    if (newAssumptions && Object.keys(newAssumptions).length) {
      setAssumptions((a) => ({ ...a, ...newAssumptions }));
    }
    if (pitchSeed) {
      pitchApi.applyAiSeed(pitchSeed);
    } else {
      pitchApi.resetToAuto();
    }
    setTimeout(() => {
      document.getElementById("forecast-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const exportCSV = () => {
    const headers = Object.keys(rows[0]).join(",");
    const body = rows.map((r) => Object.values(r).join(",")).join("\n");
    const blob = new Blob([`${headers}\n${body}`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "forecast.csv"; a.click();
    URL.revokeObjectURL(url);
  };

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
          <div className="flex gap-2">
            <Link to="/terms">
              <Button variant="ghost" size="sm">
                <BookOpen className="h-4 w-4 mr-1" /> Term Sheet
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcw className="h-4 w-4 mr-1" /> Reset
            </Button>
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-1" /> Export CSV
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="font-display text-5xl sm:text-6xl leading-[1.05] max-w-3xl">
            Forecast revenue.
            <br />
            <span className="text-muted-foreground">Model your pricing.</span>
            <br />
            Walk into your next <span className="text-primary">pitch</span> ready.
          </h1>
        </div>

        <div className="mb-8">
          <OnboardingChat onApply={applyAiRecommendation} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <KPICard term="mrr" label="MRR (final)" value={fmtCurrency(k.mrr)} hint={`Month ${assumptions.months}`} />
          <KPICard term="arr" label="ARR" value={fmtCurrency(k.arr)} tone="good" />
          <KPICard term="ltv-cac" label="LTV / CAC" value={`${k.ltvCac.toFixed(2)}x`} tone={k.ltvCac >= 3 ? "good" : k.ltvCac >= 1 ? "warn" : "bad"} hint="3x+ is healthy" />
          <KPICard term="break-even" label="Break-even" value={k.breakEven ? `Mo ${k.breakEven}` : "—"} tone={k.breakEven ? "good" : "warn"} hint={k.breakEven ? "First profitable month" : "Not in horizon"} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-1 space-y-6">
            <Panel title="Pricing tiers" subtitle="SaaS · digital · physical · refills">
              <PricingBuilder tiers={tiers} onChange={setTiers} />
            </Panel>
            <Panel title="Assumptions" subtitle="Hover any label for plain-English help">
              <AssumptionsPanel value={assumptions} onChange={setAssumptions} />
            </Panel>
          </section>

          <section className="lg:col-span-2 space-y-6">
            <div id="forecast-panel">
              <Panel title="Forecast" subtitle={`${assumptions.months} months`}>
                <Tabs defaultValue="revenue">
                  <TabsList className="bg-secondary">
                    <TabsTrigger value="revenue">Revenue</TabsTrigger>
                    <TabsTrigger value="cashflow">Cashflow</TabsTrigger>
                    <TabsTrigger value="customers">Customers</TabsTrigger>
                  </TabsList>
                  <TabsContent value="revenue" className="mt-4"><RevenueChart data={rows} /></TabsContent>
                  <TabsContent value="cashflow" className="mt-4"><CashflowChart data={rows} /></TabsContent>
                  <TabsContent value="customers" className="mt-4"><CustomersChart data={rows} /></TabsContent>
                </Tabs>
              </Panel>
            </div>

            <Panel title="VC pitch summary" subtitle="Auto-generated · fully editable">
              <VCSummary
                rows={rows}
                tiers={tiers}
                assumptions={assumptions}
                chartRef={exportChartRef}
                pitch={pitchApi.resolved}
                onCompanyName={(v) => pitchApi.setField("companyName", v)}
                onHeadline={(v) => pitchApi.setField("headline", v)}
                onBullet={pitchApi.setBullet}
                onAddBullet={pitchApi.addBullet}
                onRemoveBullet={pitchApi.removeBullet}
                onAsk={(v) => pitchApi.setField("ask", v)}
                onUse={(v) => pitchApi.setField("use", v)}
                onRunway={(v) => pitchApi.setField("runway", v)}
                onMilestone={(v) => pitchApi.setField("milestone", v)}
                onReset={pitchApi.resetToAuto}
              />
            </Panel>

            <Panel title="Ownership & Dilution" subtitle="Model your next round">
              <OwnershipPanel
                value={ownership}
                onChange={setOwnership}
                onReset={() => setOwnership(defaultOwnership)}
              />
            </Panel>



            <Panel title="Monthly table" subtitle="First 12 months — hover headers for definitions">
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full text-xs num">
                  <thead className="text-muted-foreground border-b border-border">
                    <tr>
                      {([
                        { h: "Mo" },
                        { h: "Visitors", term: "visitors" as const },
                        { h: "Signups" },
                        { h: "New paid" },
                        { h: "Active", term: "active-paid" as const },
                        { h: "MRR", term: "mrr" as const },
                        { h: "Revenue" },
                        { h: "Net", term: "net-cashflow" as const },
                      ]).map(({ h, term }) => (
                        <th key={h} className="text-right p-2 font-normal uppercase tracking-wider text-[10px]">
                          {term ? <Term term={term}>{h}</Term> : h}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {rows.slice(0, 12).map((r) => (
                      <tr key={r.month} className="border-b border-border/50">
                        <td className="text-right p-2 text-muted-foreground">{r.month}</td>
                        <td className="text-right p-2">{fmtNumber(r.visitors)}</td>
                        <td className="text-right p-2">{fmtNumber(r.signups)}</td>
                        <td className="text-right p-2">{fmtNumber(r.newPaid)}</td>
                        <td className="text-right p-2">{fmtNumber(r.activePaid)}</td>
                        <td className="text-right p-2">{fmtCurrency(r.mrr)}</td>
                        <td className="text-right p-2">{fmtCurrency(r.revenue)}</td>
                        <td className={`text-right p-2 ${r.netCashflow >= 0 ? "text-success" : "text-destructive"}`}>{fmtCurrency(r.netCashflow)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </section>
        </div>

        <footer className="mt-12 pt-6 border-t border-border text-xs text-muted-foreground">
          Saved locally in your browser. Numbers are projections — assumptions matter more than the model.
        </footer>
      </main>

      {/* Offscreen revenue chart, always mounted, used to snapshot for PDF/PPTX export */}
      <div
        aria-hidden
        style={{ position: "fixed", left: -10000, top: 0, width: 960, height: 360, pointerEvents: "none" }}
      >
        <div ref={exportChartRef} style={{ width: 960, height: 360, background: "#1A1108", padding: 16 }}>
          <RevenueChart data={rows} />
        </div>
      </div>
    </div>
  );
}

function Panel({
  title, subtitle, children,
}: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="font-display text-xl">{title}</h2>
        {subtitle && <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{subtitle}</span>}
      </div>
      {children}
    </div>
  );
}
