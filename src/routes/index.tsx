import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Download, RotateCcw } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Modelr — Business model & revenue forecasting for AI founders" },
      { name: "description", content: "Model pricing tiers, forecast revenue, and generate VC-ready summaries for your AI startup." },
    ],
  }),
  component: Index,
});

const STORAGE_KEY = "modelr.v1";

function Index() {
  const [tiers, setTiers] = useState<PricingTier[]>(defaultTiers);
  const [assumptions, setAssumptions] = useState<Assumptions>(defaultAssumptions);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (p.tiers) setTiers(p.tiers);
        if (p.assumptions) setAssumptions(p.assumptions);
      }
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ tiers, assumptions }));
  }, [tiers, assumptions, loaded]);

  const rows = useMemo(() => runForecast(tiers, assumptions), [tiers, assumptions]);
  const k = useMemo(() => computeKPIs(rows, assumptions), [rows, assumptions]);

  const reset = () => {
    setTiers(defaultTiers);
    setAssumptions(defaultAssumptions);
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
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <div className="font-display text-xl leading-none">Modelr</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-1">
                Business modeling for AI founders
              </div>
            </div>
          </div>
          <div className="flex gap-2">
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
            Design your pricing.
            <br />
            <span className="text-muted-foreground">Forecast your revenue.</span>
            <br />
            Pitch with <span className="text-primary italic">numbers</span>.
          </h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <KPICard label="MRR (final)" value={fmtCurrency(k.mrr)} hint={`Month ${assumptions.months}`} />
          <KPICard label="ARR" value={fmtCurrency(k.arr)} tone="good" />
          <KPICard label="LTV / CAC" value={`${k.ltvCac.toFixed(2)}x`} tone={k.ltvCac >= 3 ? "good" : k.ltvCac >= 1 ? "warn" : "bad"} hint="3x+ is healthy" />
          <KPICard label="Break-even" value={k.breakEven ? `Mo ${k.breakEven}` : "—"} tone={k.breakEven ? "good" : "warn"} hint={k.breakEven ? "First profitable month" : "Not in horizon"} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-1 space-y-6">
            <Panel title="Pricing tiers" subtitle="Free, subscription, one-time">
              <PricingBuilder tiers={tiers} onChange={setTiers} />
            </Panel>
            <Panel title="Assumptions" subtitle="Growth, conversion, costs">
              <AssumptionsPanel value={assumptions} onChange={setAssumptions} />
            </Panel>
          </section>

          <section className="lg:col-span-2 space-y-6">
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

            <Panel title="VC pitch summary" subtitle="Auto-generated from your model">
              <VCSummary rows={rows} tiers={tiers} assumptions={assumptions} />
            </Panel>

            <Panel title="Monthly table" subtitle="First 12 months">
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full text-xs num">
                  <thead className="text-muted-foreground border-b border-border">
                    <tr>
                      {["Mo", "Visitors", "Signups", "New paid", "Active", "MRR", "Revenue", "Net"].map((h) => (
                        <th key={h} className="text-right p-2 font-normal uppercase tracking-wider text-[10px]">{h}</th>
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
