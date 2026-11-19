import { jsPDF } from "jspdf";
import autoTable, { type RowInput } from "jspdf-autotable";
import type { PakbonItem, PaklijnItem } from "@/lib/api-client";
import { drawNomaledHeader, NOMA_GREEN } from "@/lib/export/pdf-header";
import { buildPakbonRows, buildPakbonSections } from "./pakbon-export";

export function downloadPakbonPdf(pakbon: PakbonItem, lines: PaklijnItem[]) {
  const doc = new jsPDF();
  const { header, sections } = buildPakbonSections(pakbon, lines);
  const body: RowInput[] = buildPakbonRows(lines).map((row) => row.kind === "article" ? row.cells : [{
    content: row.cells[0], colSpan: 4,
    styles: row.kind === "title" ? { fontStyle: "bold", textColor: NOMA_GREEN } : {},
  }]);
  const generated = `Gegenereerd op ${new Date().toLocaleDateString("nl-BE")}`;
  doc.setFontSize(10);
  const headerLines = header.flatMap((line) => doc.splitTextToSize(line, 180) as string[]);
  const headerBottom = drawNomaledHeader(doc, `Pakbon ${pakbon.paknr}`, headerLines, generated);
  autoTable(doc, {
    startY: headerBottom,
    margin: { top: headerBottom, bottom: 18 },
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 2 },
    body: sections.map(([label, ...text]) => [label, text.join("\n")]),
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 45 } },
  });
  const sectionEnd = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  autoTable(doc, {
    startY: sectionEnd + 6,
    margin: { top: headerBottom, bottom: 18 },
    head: [["Bonnr", "Artnr", "Omschrijving", "Aantal"]],
    body,
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: NOMA_GREEN },
    columnStyles: { 3: { halign: "right" } },
  });
  let end = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 14;
  if (end > 260) { doc.addPage(); end = headerBottom + 14; }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(37, 45, 47);
  doc.text("Handtekening ontvangst", 15, end);
  doc.line(15, end + 16, 95, end + 16);
  const total = doc.getNumberOfPages();
  for (let page = 1; page <= total; page++) {
    doc.setPage(page);
    drawNomaledHeader(doc, `Pakbon ${pakbon.paknr}`, headerLines, generated);
    doc.text(`pagina ${page}/${total}`, 195, 287, { align: "right" });
  }
  doc.save(`pakbon-${pakbon.paknr}.pdf`);
}
