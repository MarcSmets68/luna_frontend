// Export logic for the Verkoopsanalyse (CSV + PDF). Model builders are pure;
// only `renderPdf` touches jsPDF/autoTable. Same conventions as the
// omzetanalyse-dealers export (Nomaled header, nl-BE formats, CSV guard).

import type { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { VerkoopMaand, VerkoopsanalyseResponse } from "@/lib/api-client";
import { CSV_BOM, CSV_DELIMITER, escapeCsvField } from "@/lib/export/csv";
import { NOMA_DARK_GREY, NOMA_GREEN, WHITE, drawNomaledHeader } from "@/lib/export/pdf-header";
import {
  formatDate,
  formatGrowth,
  formatMoney,
  formatQty,
} from "@/features/omzetanalyse-dealers/lib/omzetanalyse-format";
import {
  groei,
  maandLabel,
  rijLabel,
  sommeer,
  totaalAantalZinvol,
} from "./verkoopsanalyse-model";

export const CSV_HEADERS = [
  "Artnr",
  "Omschrijving",
  "Eenheid",
  "Maand",
  "Aantal",
  "Aantal vorig jaar",
  "Groei aantal %",
  "Omzet",
  "Omzet vorig jaar",
  "Groei omzet %",
] as const;

function pct(value: number | null): string {
  return value === null ? "" : value.toFixed(1);
}

export function buildPeriodeLines(response: VerkoopsanalyseResponse): string[] {
  return [
    `Periode: ${formatDate(response.periodeVan)} t/m ${formatDate(response.periodeTot)}`,
    `Vergeleken met: ${formatDate(response.vorigePeriodeVan)} t/m ${formatDate(response.vorigePeriodeTot)}`,
  ];
}

function selectieLines(response: VerkoopsanalyseResponse, gekozenDealers: number): string[] {
  const dealers =
    gekozenDealers === 0
      ? `Alle Nomaled-dealers (${response.dealers.length})`
      : response.dealers.map((d) => `${d.naam} (${d.klnr})`).join(", ");
  const artikelen =
    response.rijen.length === 0 ? "Alle artikelen" : response.rijen.map((r) => rijLabel(r)).join(", ");
  return [`Dealers: ${dealers}`, `Artikelen: ${artikelen}`];
}

export function buildCsvContent(response: VerkoopsanalyseResponse, gekozenDealers: number): string {
  const lines: string[] = [];
  const pre = (k: string, v: string) => lines.push(`${k}${CSV_DELIMITER}${escapeCsvField(v)}`);
  pre("Periode", `${response.periodeVan} t/m ${response.periodeTot}`);
  pre("Vorige periode", `${response.vorigePeriodeVan} t/m ${response.vorigePeriodeTot}`);
  const [dealers, artikelen] = selectieLines(response, gekozenDealers);
  pre("Dealers", dealers.replace(/^Dealers: /, ""));
  pre("Artikelen", artikelen.replace(/^Artikelen: /, ""));
  lines.push("");
  lines.push(CSV_HEADERS.join(CSV_DELIMITER));

  const addRow = (artnr: string, omschr: string, eenheid: string, m: VerkoopMaand, metAantal: boolean) => {
    const cells = [
      artnr,
      omschr,
      eenheid,
      m.maand,
      metAantal ? String(m.aantal) : "",
      metAantal ? String(m.aantalVorigJaar) : "",
      metAantal ? pct(groei(m.aantal, m.aantalVorigJaar)) : "",
      String(m.omzet),
      String(m.omzetVorigJaar),
      pct(groei(m.omzet, m.omzetVorigJaar)),
    ];
    // The first four columns are text; the rest is numeric.
    lines.push(cells.map((c, i) => escapeCsvField(c, { numeric: i > 3 })).join(CSV_DELIMITER));
  };

  for (const rij of response.rijen) {
    const artnr = rij.swBegins ? `${rij.artnr}*` : rij.artnr;
    for (const m of rij.maanden) addRow(artnr, rij.omschrijving ?? "", rij.eenheid ?? "", m, true);
  }
  const totaalMetAantal = totaalAantalZinvol(response.rijen);
  for (const m of response.totaal) addRow("TOTAAL", "", "", m, totaalMetAantal);

  return CSV_BOM + lines.join("\n");
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** e.g. `verkoopsanalyse_2026-11-15` (client-side current date). */
export function buildExportFileBaseName(now: Date = new Date()): string {
  return `verkoopsanalyse_${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

// ---------------------------------------------------------------- PDF model

export type PdfTableModel = { title: string; head: string[][]; body: string[][]; foot: string[][] };

// Helvetica (WinAnsi) has no true minus sign / narrow nbsp.
function pdfGrowth(value: number | null): string {
  return formatGrowth(value).replace("−", "-").replace(" ", " ");
}

function pdfSafe(text: string): string {
  return text.replace(/…/g, "...").replace(/ /g, " ");
}

function maandTable(title: string, maanden: VerkoopMaand[], metAantal: boolean): PdfTableModel {
  const head = [
    metAantal
      ? ["Maand", "Aantal", "Vorig jaar", "Groei", "Omzet (EUR)", "Vorig jaar", "Groei"]
      : ["Maand", "Omzet (EUR)", "Vorig jaar", "Groei"],
  ];
  const row = (label: string, m: Omit<VerkoopMaand, "maand">) => [
    label,
    ...(metAantal
      ? [formatQty(m.aantal), formatQty(m.aantalVorigJaar), pdfGrowth(groei(m.aantal, m.aantalVorigJaar))]
      : []),
    formatMoney(m.omzet),
    formatMoney(m.omzetVorigJaar),
    pdfGrowth(groei(m.omzet, m.omzetVorigJaar)),
  ];
  return {
    title: pdfSafe(title),
    head,
    body: maanden.map((m) => row(maandLabel(m.maand), m)),
    foot: [row("Totaal 12 maanden", sommeer(maanden))],
  };
}

export function buildPdfModel(response: VerkoopsanalyseResponse): PdfTableModel[] {
  const tables = [
    maandTable("Totaal van de selectie", response.totaal, totaalAantalZinvol(response.rijen)),
  ];
  // A single row is identical to the total: no need to print it twice.
  if (response.rijen.length > 1) {
    for (const rij of response.rijen) {
      const omschr = rij.omschrijving ? ` - ${rij.omschrijving}` : "";
      const eenheid = rij.eenheid ? ` (${rij.eenheid})` : "";
      tables.push(maandTable(`${rijLabel(rij)}${omschr}${eenheid}`, rij.maanden, true));
    }
  }
  return tables;
}

const MIN_SPACE_AFTER_TITLE_MM = 45;

/** Renders the whole report into a landscape A4 jsPDF document. */
export function renderPdf(
  doc: jsPDF,
  response: VerkoopsanalyseResponse,
  gekozenDealers: number,
  now: Date = new Date(),
): void {
  const marginLeft = 15;
  const generatedAt = `Gegenereerd op: ${formatDate(now.toISOString())} ${now.toLocaleTimeString("nl-BE", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
  const headerLines = [...buildPeriodeLines(response), ...selectieLines(response, gekozenDealers)].map(
    (line) => pdfSafe(line.length > 160 ? `${line.slice(0, 157)}...` : line),
  );
  let y = drawNomaledHeader(doc, "Verkoopsanalyse", headerLines, generatedAt, marginLeft);

  const finalY = () => (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY;

  for (const table of buildPdfModel(response)) {
    const pageH = doc.internal.pageSize.getHeight();
    if (y + MIN_SPACE_AFTER_TITLE_MM > pageH - marginLeft) {
      doc.addPage();
      y = 20;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...NOMA_DARK_GREY);
    doc.text(table.title, marginLeft, y + 3);
    y += 6;
    autoTable(doc, {
      startY: y,
      head: table.head,
      body: table.body,
      foot: table.foot,
      margin: { left: marginLeft, right: marginLeft },
      styles: { font: "helvetica", fontSize: 8, halign: "right" },
      columnStyles: { 0: { halign: "left" } },
      headStyles: { fillColor: NOMA_GREEN, textColor: WHITE, halign: "center" },
      footStyles: { fillColor: [240, 243, 242], textColor: NOMA_DARK_GREY, fontStyle: "bold", halign: "right" },
      showFoot: "lastPage",
    });
    y = (finalY() ?? y) + 8;
  }
}
