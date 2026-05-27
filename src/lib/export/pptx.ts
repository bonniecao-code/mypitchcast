import PptxGenJS from "pptxgenjs";
import { brand, type DeckData } from "./deck";

export async function exportPptx(deck: DeckData) {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 in
  pptx.title = `${deck.companyName} — Pitchcast`;

  const W = 13.333;
  const H = 7.5;
  const fillBg = { color: brand.bg };

  // --- Slide 1: Cover ---
  const s1 = pptx.addSlide();
  s1.background = fillBg;
  s1.addShape("rect", { x: 0, y: H - 0.15, w: W, h: 0.15, fill: { color: brand.primary }, line: { type: "none" } });
  s1.addText("pitchcast", {
    x: 0.6, y: 0.5, w: 6, h: 0.8,
    fontFace: "Calibri", fontSize: 36, bold: true, color: brand.text,
  });
  s1.addText(deck.cover.tagline.toUpperCase(), {
    x: 0.6, y: 1.2, w: 6, h: 0.4,
    fontFace: "Calibri", fontSize: 12, color: brand.primary, charSpacing: 4,
  });
  s1.addText(deck.companyName, {
    x: 0.6, y: 2.4, w: 12, h: 1.2,
    fontFace: "Calibri", fontSize: 60, bold: true, color: brand.text,
  });
  s1.addText(deck.cover.arrHeadline, {
    x: 0.6, y: 3.8, w: 12, h: 1,
    fontFace: "Calibri", fontSize: 32, color: brand.accent,
  });
  s1.addText("Investor summary · generated with Pitchcast", {
    x: 0.6, y: H - 0.9, w: 12, h: 0.3,
    fontFace: "Calibri", fontSize: 11, color: brand.muted,
  });

  // --- Slide 2: The pitch ---
  const s2 = pptx.addSlide();
  s2.background = fillBg;
  s2.addText("The pitch", {
    x: 0.6, y: 0.4, w: 12, h: 0.6,
    fontFace: "Calibri", fontSize: 14, color: brand.primary, charSpacing: 4, bold: true,
  });
  s2.addText(deck.pitch.headline, {
    x: 0.6, y: 1.0, w: 12, h: 1.8,
    fontFace: "Calibri", fontSize: 30, bold: true, color: brand.text,
  });
  deck.pitch.bullets.forEach((b, i) => {
    const y = 3.2 + i * 0.85;
    s2.addText(`0${i + 1}`, {
      x: 0.6, y, w: 0.8, h: 0.6,
      fontFace: "Calibri", fontSize: 22, bold: true, color: brand.primary,
    });
    s2.addText(b, {
      x: 1.4, y, w: 11.3, h: 0.7,
      fontFace: "Calibri", fontSize: 18, color: brand.text, valign: "middle",
    });
  });

  // --- Slide 3: Key metrics (2x2) ---
  const s3 = pptx.addSlide();
  s3.background = fillBg;
  s3.addText("Key metrics", {
    x: 0.6, y: 0.4, w: 12, h: 0.6,
    fontFace: "Calibri", fontSize: 14, color: brand.primary, charSpacing: 4, bold: true,
  });
  const cardW = 5.8, cardH = 2.5, gap = 0.4, originX = 0.6, originY = 1.4;
  deck.metrics.forEach((m, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = originX + col * (cardW + gap);
    const y = originY + row * (cardH + gap);
    s3.addShape("roundRect", {
      x, y, w: cardW, h: cardH,
      fill: { color: brand.card }, line: { color: brand.border, width: 1 },
      rectRadius: 0.1,
    });
    s3.addText(m.label.toUpperCase(), {
      x: x + 0.3, y: y + 0.25, w: cardW - 0.6, h: 0.35,
      fontFace: "Calibri", fontSize: 10, color: brand.muted, charSpacing: 3, bold: true,
    });
    s3.addText(m.value, {
      x: x + 0.3, y: y + 0.7, w: cardW - 0.6, h: 1.2,
      fontFace: "Calibri", fontSize: 48, bold: true, color: brand.primary,
    });
    if (m.hint) {
      s3.addText(m.hint, {
        x: x + 0.3, y: y + 1.9, w: cardW - 0.6, h: 0.4,
        fontFace: "Calibri", fontSize: 12, color: brand.muted,
      });
    }
  });

  // --- Slide 4: Forecast ---
  const s4 = pptx.addSlide();
  s4.background = fillBg;
  s4.addText("Forecast at a glance", {
    x: 0.6, y: 0.4, w: 12, h: 0.6,
    fontFace: "Calibri", fontSize: 14, color: brand.primary, charSpacing: 4, bold: true,
  });
  s4.addText(`Revenue · ${deck.cover.monthsHorizon} months`, {
    x: 0.6, y: 1.0, w: 12, h: 0.6,
    fontFace: "Calibri", fontSize: 24, bold: true, color: brand.text,
  });
  if (deck.forecast.chartPng) {
    s4.addImage({
      data: deck.forecast.chartPng,
      x: 0.6, y: 1.8, w: 12, h: 4.0,
    });
  } else {
    s4.addText("(chart unavailable)", {
      x: 0.6, y: 3, w: 12, h: 1,
      fontFace: "Calibri", fontSize: 14, color: brand.muted, align: "center",
    });
  }
  // Stat strip
  const statW = 3, statY = 6.1, statGap = 0.05;
  deck.forecast.stats.forEach((st, i) => {
    const x = 0.6 + i * (statW + statGap);
    s4.addText(st.label.toUpperCase(), {
      x, y: statY, w: statW, h: 0.3,
      fontFace: "Calibri", fontSize: 9, color: brand.muted, charSpacing: 3, bold: true,
    });
    s4.addText(st.value, {
      x, y: statY + 0.3, w: statW, h: 0.6,
      fontFace: "Calibri", fontSize: 20, bold: true, color: brand.text,
    });
  });

  await pptx.writeFile({ fileName: "pitchcast-summary.pptx" });
}
