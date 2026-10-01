import type { jsPDF } from "jspdf";

// Noma brand colors, see docs/design-system.md.
export const NOMA_DARK_GREY: [number, number, number] = [37, 45, 47]; // #252d2f
export const NOMA_GREEN: [number, number, number] = [96, 161, 114]; // #60a172
export const NEUTRAL_600: [number, number, number] = [99, 120, 126]; // #63787e
export const WHITE: [number, number, number] = [255, 255, 255];

/**
 * Draws the Nomaled wordmark, a bold title, optional info lines and a small
 * grey "Gegenereerd op" line. Returns the y position below the header.
 * Only uses setFont/setFontSize/setTextColor/text/getTextWidth.
 */
export function drawNomaledHeader(
  doc: jsPDF,
  title: string,
  lines: string[],
  generatedAtLabel: string,
  marginLeft = 15
): number {
  let y = 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(16);
  doc.setTextColor(...NOMA_DARK_GREY);
  doc.text("Noma", marginLeft, y);
  const nomaWidth = doc.getTextWidth("Noma");
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NOMA_GREEN);
  doc.text("led", marginLeft + nomaWidth, y);

  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...NOMA_DARK_GREY);
  doc.text(title, marginLeft, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...NOMA_DARK_GREY);
  for (const line of lines) {
    y += 7;
    doc.text(line, marginLeft, y);
  }

  y += 6;
  doc.setFontSize(8);
  doc.setTextColor(...NEUTRAL_600);
  doc.text(generatedAtLabel, marginLeft, y);

  return y + 6;
}
