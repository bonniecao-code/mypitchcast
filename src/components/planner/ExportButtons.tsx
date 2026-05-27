import { useState, type RefObject } from "react";
import { FileDown, Loader2, Presentation } from "lucide-react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Assumptions, MonthRow, PricingTier } from "@/lib/forecast";
import { buildDeck } from "@/lib/export/deck";
import { exportPdf } from "@/lib/export/pdf";
import { exportPptx } from "@/lib/export/pptx";

type Props = {
  rows: MonthRow[];
  tiers: PricingTier[];
  assumptions: Assumptions;
  chartRef: RefObject<HTMLDivElement | null>;
  companyName?: string;
};

export function ExportButtons({ rows, tiers, assumptions, chartRef, companyName }: Props) {
  const [busy, setBusy] = useState<null | "pdf" | "pptx">(null);

  const snapshotChart = async (): Promise<string | undefined> => {
    const node = chartRef.current;
    if (!node) return undefined;
    try {
      // Use the cocoa background so the chart blends into the slide.
      return await toPng(node, {
        pixelRatio: 2,
        backgroundColor: "#1A1108",
        cacheBust: true,
      });
    } catch (e) {
      console.warn("Chart snapshot failed", e);
      return undefined;
    }
  };

  const handle = async (kind: "pdf" | "pptx") => {
    setBusy(kind);
    try {
      const chartPng = await snapshotChart();
      const deck = buildDeck(rows, tiers, assumptions, chartPng, companyName);
      if (kind === "pdf") await exportPdf(deck);
      else await exportPptx(deck);
      toast.success(`${kind.toUpperCase()} downloaded`);
    } catch (e) {
      console.error(e);
      toast.error(`Couldn't generate ${kind.toUpperCase()}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => handle("pdf")} disabled={!!busy}>
        {busy === "pdf"
          ? <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          : <FileDown className="h-4 w-4 mr-1" />}
        PDF
      </Button>
      <Button variant="default" size="sm" onClick={() => handle("pptx")} disabled={!!busy}>
        {busy === "pptx"
          ? <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          : <Presentation className="h-4 w-4 mr-1" />}
        PowerPoint
      </Button>
    </div>
  );
}
