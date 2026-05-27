import jsPDF from "jspdf";
import { brand, type DeckData } from "./deck";

// Helpers
const hex = (h: string): [number, number, number] => [
  parseInt(h.slice(0, 2), 16),
  parseInt(h.slice(2, 4), 16),
  parseInt(h.slice(4, 6), 16),
];

export async function exportPdf(deck: DeckData) {
  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: [960, 540] });
  const W = 960, H = 540;

  const fillBg = (doc: jsPDF) => {
    doc.setFillColor(...hex(brand.bg));
    doc.rect(0, 0, W, H, "F");
  };
  const setText = (c: string) => pdf.setTextColor(...hex(c));

  // --- Slide 1: Cover ---
  fillBg(pdf);
  pdf.setFillColor(...hex(brand.primary));
  pdf.rect(0, H - 8, W, 8, "F");

  pdf.setFont("helvetica", "bold");
  setText(brand.text);
  pdf.setFontSize(28);
  pdf.text("pitchcast", 40, 60);

  setText(brand.primary);
  pdf.setFontSize(10);
  pdf.text(deck.cover.tagline.toUpperCase(), 40, 80, { charSpace: 2 });

  setText(brand.text);
  pdf.setFontSize(48);
  pdf.text(deck.companyName, 40, 200);

  setText(brand.accent);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(22);
  pdf.text(deck.cover.arrHeadline, 40, 250);

  setText(brand.muted);
  pdf.setFontSize(9);
  pdf.text("Investor summary · generated with Pitchcast", 40, H - 25);

  // --- Slide 2: Pitch ---
  pdf.addPage([960, 540], "landscape");
  fillBg(pdf);
  setText(brand.primary);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text("THE PITCH", 40, 50, { charSpace: 2 });

  setText(brand.text);
  pdf.setFontSize(22);
  const headlineLines = pdf.splitTextToSize(deck.pitch.headline, W - 80);
  pdf.text(headlineLines, 40, 90);

  pdf.setFont("helvetica", "normal");
  let by = 200;
  deck.pitch.bullets.forEach((b, i) => {
    setText(brand.primary);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text(`0${i + 1}`, 40, by);
    setText(brand.text);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(13);
    const lines = pdf.splitTextToSize(b, W - 110);
    pdf.text(lines, 80, by);
    by += Math.max(40, lines.length * 18 + 12);
  });

  // --- Slide 3: Key metrics ---
  pdf.addPage([960, 540], "landscape");
  fillBg(pdf);
  setText(brand.primary);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text("KEY METRICS", 40, 50, { charSpace: 2 });

  const cardW = 420, cardH = 180, gap = 20, ox = 40, oy = 90;
  deck.metrics.forEach((m, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = ox + col * (cardW + gap);
    const y = oy + row * (cardH + gap);
    pdf.setFillColor(...hex(brand.card));
    pdf.setDrawColor(...hex(brand.border));
    pdf.setLineWidth(1);
    pdf.roundedRect(x, y, cardW, cardH, 8, 8, "FD");

    setText(brand.muted);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.text(m.label.toUpperCase(), x + 20, y + 28, { charSpace: 2 });

    setText(brand.primary);
    pdf.setFontSize(40);
    pdf.text(m.value, x + 20, y + 95);

    if (m.hint) {
      setText(brand.muted);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.text(m.hint, x + 20, y + 130);
    }
  });

  // --- Slide 4: Forecast ---
  pdf.addPage([960, 540], "landscape");
  fillBg(pdf);
  setText(brand.primary);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text("FORECAST AT A GLANCE", 40, 50, { charSpace: 2 });

  setText(brand.text);
  pdf.setFontSize(20);
  pdf.text(`Revenue · ${deck.cover.monthsHorizon} months`, 40, 80);

  if (deck.forecast.chartPng) {
    try {
      pdf.addImage(deck.forecast.chartPng, "PNG", 40, 100, W - 80, 290);
    } catch {
      setText(brand.muted);
      pdf.setFontSize(12);
      pdf.text("(chart unavailable)", W / 2, 240, { align: "center" });
    }
  }

  // Stat strip
  const sw = 210, sy = 430, sgap = 10;
  deck.forecast.stats.forEach((st, i) => {
    const x = 40 + i * (sw + sgap);
    setText(brand.muted);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.text(st.label.toUpperCase(), x, sy, { charSpace: 2 });
    setText(brand.text);
    pdf.setFontSize(16);
    pdf.text(st.value, x, sy + 24);
  });

  pdf.save("pitchcast-summary.pdf");
}
