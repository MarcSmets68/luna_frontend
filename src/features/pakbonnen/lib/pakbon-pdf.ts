import { jsPDF } from "jspdf";
import autoTable, { type RowInput } from "jspdf-autotable";
import JsBarcode from "jsbarcode";
import type { PakbonItem, PaklijnItem } from "@/lib/api-client";
import { drawNomaledHeader, NOMA_GREEN } from "@/lib/export/pdf-header";
import { buildPakbonRows, buildPakbonSections } from "./pakbon-export";

function tableEnd(doc: jsPDF): number {
  return (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
}

function drawPakbonBarcode(doc: jsPDF, paknr: number) {
  const barcode: { encodings?: { data: string }[] } = {};
  JsBarcode(barcode, String(paknr), { format: "CODE39", displayValue: false });
  const bars = barcode.encodings?.map((encoding) => encoding.data).join("") ?? "";
  const width = 50 / bars.length;
  doc.setFillColor(0, 0, 0);
  for (let index = 0; index < bars.length; index++) {
    if (bars[index] === "1") {
      doc.rect(145 + index * width, 15, width, 10, "F");
    }
  }
  doc.setFontSize(8);
  doc.text(`*${paknr}*`, 170, 29, { align: "center" });
}

export function downloadPakbonPdf(pakbon: PakbonItem, lines: PaklijnItem[]) {
  const doc = new jsPDF();
  const { header, sections } = buildPakbonSections(pakbon, lines);
  const rows = buildPakbonRows(lines);
  const body: RowInput[] = rows.map((row) => {
    if (row.kind === "article") {
      return row.cells;
    }
    return [
      {
        content: row.cells[0],
        colSpan: 3,
        styles: row.kind === "title"
          ? { fontStyle: "bold", textColor: NOMA_GREEN }
          : { fontStyle: row.kind === "order" ? "bold" : "italic" },
      },
    ];
  });
  const generated = `Gegenereerd op ${new Date().toLocaleDateString("nl-BE")}`;
  doc.setFontSize(10);
  const headerLines = header.flatMap((line) => doc.splitTextToSize(line, 180) as string[]);
  const title = `Verzendnota ${pakbon.paknr}`;
  const headerBottom = drawNomaledHeader(doc, title, headerLines, generated);
  drawPakbonBarcode(doc, pakbon.paknr);
  autoTable(doc, {
    startY: headerBottom,
    margin: { top: headerBottom, bottom: 18 },
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 2 },
    body: sections.map(([label, ...text]) => [label, text.join("\n")]),
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 45 } },
  });
  const sectionEnd = tableEnd(doc);
  autoTable(doc, {
    startY: sectionEnd + 6,
    margin: { top: headerBottom, bottom: 18 },
    head: [["Artikelnr", "Omschrijving", "Aantal"]],
    body,
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: NOMA_GREEN },
    columnStyles: { 2: { halign: "right" } },
  });
  let end = tableEnd(doc) + 14;
  if (end > 252) {
    doc.addPage();
    end = headerBottom + 14;
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(37, 45, 47);
  doc.text(`Totaal aantal items : ${rows.filter((row) => row.kind === "article").length}`, 15, end);
  doc.text("Handtekening ontvangst", 15, end + 8);
  doc.line(15, end + 24, 95, end + 24);
  const total = doc.getNumberOfPages();
  for (let page = 1; page <= total; page++) {
    doc.setPage(page);
    if (page > 1) {
      drawNomaledHeader(doc, title, headerLines, generated);
      drawPakbonBarcode(doc, pakbon.paknr);
    }
    doc.setFontSize(8);
    doc.text(`Blz. : ${page}/${total}`, 195, 287, { align: "right" });
  }
  doc.save(`pakbon-${pakbon.paknr}.pdf`);
}
