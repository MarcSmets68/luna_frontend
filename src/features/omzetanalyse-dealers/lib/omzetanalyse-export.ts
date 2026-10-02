// Export logic for Omzetanalyse dealers (CSV + PDF). Model builders are pure;
// only `renderPdf` touches jsPDF/autoTable. Download triggering lives in the
// toolbar component.

import type { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type {
  OmzetCategorie,
  OmzetPeriode,
  OmzetSectie,
  OmzetanalyseResponse,
} from "@/lib/api-client";
import { CSV_BOM, CSV_DELIMITER, escapeCsvField } from "@/lib/export/csv";
import { NOMA_DARK_GREY, NOMA_GREEN, WHITE, drawNomaledHeader } from "@/lib/export/pdf-header";
import {
  formatDate,
  formatGrowth,
  formatInteger,
  formatMoney,
  formatQty,
  getKolomLabels,
} from "./omzetanalyse-format";

export { getKolomLabels };

export const CSV_HEADERS = [
  "Dealer klnr",
  "Dealer naam",
  "Categorie",
  "Artnr",
  "Eenheid",
  "Regeltype",
  "Kolom",
  "Qty los",
  "Qty productie",
  "Aantal orders",
  "Omzet los",
  "Omzet productie",
  "Omzet totaal",
  "Groei qty los %",
  "Groei qty productie %",
  "Groei orders %",
  "Groei omzet los %",
  "Groei omzet productie %",
  "Groei omzet totaal %",
  "Meters ledstrip",
  "Meters cover",
] as const;

function num(value: number | null | undefined): string {
  return value === null || value === undefined ? "" : String(value);
}

type CsvValues = {
  qtyLos?: string;
  qtyProductie?: string;
  aantalOrders?: string;
  omzetLos?: string;
  omzetProductie?: string;
  omzetTotaal?: string;
  groei?: string[]; // 6 entries
  metersLed?: string;
  metersCover?: string;
};

function periodeValues(p: OmzetPeriode | undefined, withQty: boolean, withOrders: boolean, withOmzet: boolean): CsvValues {
  if (!p) return {};
  return {
    qtyLos: withQty ? num(p.qtyLos) : "",
    qtyProductie: withQty ? num(p.qtyProductie) : "",
    aantalOrders: withOrders ? num(p.aantalOrders) : "",
    omzetLos: withOmzet ? num(p.omzetLos) : "",
    omzetProductie: withOmzet ? num(p.omzetProductie) : "",
    omzetTotaal: withOmzet ? num(p.omzetTotaal) : "",
    groei: [
      withQty ? num(p.groeiQtyLos) : "",
      withQty ? num(p.groeiQtyProductie) : "",
      withOrders ? num(p.groeiAantalOrders) : "",
      withOmzet ? num(p.groeiOmzetLos) : "",
      withOmzet ? num(p.groeiOmzetProductie) : "",
      withOmzet ? num(p.groeiOmzetTotaal) : "",
    ],
  };
}

export function buildCsvContent(response: OmzetanalyseResponse): string {
  const { filters } = response;
  const labels = getKolomLabels(response);
  const lines: string[] = [];
  const pre = (k: string, v: string) => lines.push(`${k}${CSV_DELIMITER}${escapeCsvField(v)}`);

  pre("Modus", response.modus);
  pre("Datum van", filters.datumVan ?? "");
  pre("Datum tot", filters.datumTot ?? "");
  pre(
    "Klant",
    filters.klnr !== null ? `${filters.klnr} - ${filters.klantNaam ?? ""}`.trim() : ""
  );
  pre("Soort", filters.soort ? `${filters.soort} - ${filters.soortOmschr ?? ""}`.trim() : "");
  pre("Per dealer", filters.perDealer ? "Ja" : "Nee");
  lines.push("");
  lines.push(CSV_HEADERS.join(CSV_DELIMITER));

  function addRow(
    sectie: OmzetSectie,
    categorie: string,
    artnr: string,
    eenheid: string,
    regeltype: string,
    kolom: string,
    v: CsvValues
  ) {
    const g = v.groei ?? ["", "", "", "", "", ""];
    const cells = [
      sectie.dealerKlnr === null ? "" : String(sectie.dealerKlnr),
      sectie.dealerNaam ?? "",
      categorie,
      artnr,
      eenheid,
      regeltype,
      kolom,
      v.qtyLos ?? "",
      v.qtyProductie ?? "",
      v.aantalOrders ?? "",
      v.omzetLos ?? "",
      v.omzetProductie ?? "",
      v.omzetTotaal ?? "",
      ...g,
      v.metersLed ?? "",
      v.metersCover ?? "",
    ];
    lines.push(cells.map(escapeCsvField).join(CSV_DELIMITER));
  }

  for (const sectie of response.secties) {
    for (const cat of sectie.categorieen) {
      for (const rij of cat.rijen) {
        labels.forEach((label, i) => {
          addRow(
            sectie,
            cat.categorie,
            rij.swBegins ? `${rij.artnr}*` : rij.artnr,
            rij.eenheid ?? "",
            "ARTIKEL",
            label,
            periodeValues(rij.perioden[i], true, false, false)
          );
        });
      }
      labels.forEach((label, i) => {
        addRow(
          sectie,
          cat.categorie,
          "",
          "",
          "CATEGORIE_TOTAAL",
          label,
          periodeValues(cat.totalen[i], !cat.gemengdeEenheden, true, true)
        );
      });
    }
    labels.forEach((label, i) => {
      addRow(sectie, "", "", "", "SECTIE_TOTAAL", label, periodeValues(sectie.omzet[i], false, true, true));
    });
    labels.forEach((label, i) => {
      addRow(sectie, "", "", "", "METERS", label, {
        metersLed: num(sectie.meters.ledstripNomatrack[i]),
        metersCover: num(sectie.meters.coverLicht[i]),
      });
    });
  }

  return CSV_BOM + lines.join("\n");
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** e.g. `omzetanalyse-dealers_2026-09-03` (client-side current date). */
export function buildExportFileBaseName(now: Date = new Date()): string {
  return `omzetanalyse-dealers_${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

// ---------------------------------------------------------------- PDF model

export type PdfCell = string | { content: string; colSpan?: number; styles?: Record<string, unknown> };

export type PdfTableModel = { head: PdfCell[][]; body: PdfCell[][]; title?: string | null };

/** Sanitises a category name for Helvetica (WinAnsi); no case/other transformation. */
export function pdfTitle(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw
    .replace(/\u00A0/g, " ")
    .replace(/\u2212/g, "-")
    .replace(/[\u0000-\u001F\u007F-\u009F]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned === "" ? null : cleaned;
}

export type PdfSectionModel = {
  heading: string | null;
  tables: PdfTableModel[];
};

// Helvetica (WinAnsi) has no true minus sign / nbsp-safe rendering.
function pdfGrowth(value: number | null): string {
  return formatGrowth(value).replace("\u2212", "-").replace("\u00A0", " ");
}

// Empty string instead of an em-dash for null (jspdf-autotable quirk).
function cell(text: string, growth: number | null, showGrowth: boolean): string {
  const g = showGrowth ? pdfGrowth(growth) : "";
  return g ? `${text}\n${g}` : text;
}

const blankIfNull = (formatted: string, value: number | null) => (value === null ? "" : formatted);

function categorieTable(cat: OmzetCategorie, labels: string[], growth: boolean): PdfTableModel {
  const head: PdfCell[][] = [
    ["Artnr", "Eenh.", ...labels.map((l) => ({ content: l, colSpan: 2 }))],
    ["", "", ...labels.flatMap(() => ["Los", "Productie"])],
  ];
  const body: PdfCell[][] = [];
  for (const rij of cat.rijen) {
    body.push([
      rij.swBegins ? `${rij.artnr}...` : rij.artnr,
      rij.eenheid ?? "",
      ...labels.flatMap((_, i) => {
        const p = rij.perioden[i];
        return [
          cell(blankIfNull(formatQty(p?.qtyLos ?? null), p?.qtyLos ?? null), p?.groeiQtyLos ?? null, growth),
          cell(
            blankIfNull(formatQty(p?.qtyProductie ?? null), p?.qtyProductie ?? null),
            p?.groeiQtyProductie ?? null,
            growth
          ),
        ];
      }),
    ]);
  }
  const bold = { fontStyle: "bold" };
  const span = (label: string, pick: (p: OmzetPeriode) => [string, number | null]): PdfCell[] => [
    { content: label, colSpan: 2, styles: bold },
    ...labels.map((_, i) => {
      const p = cat.totalen[i];
      const [text, g] = p ? pick(p) : ["", null];
      return { content: cell(text, g, growth), colSpan: 2, styles: bold };
    }),
  ];
  const qtyCells = (p: OmzetPeriode | undefined): PdfCell[] => [
    { content: cell(blankIfNull(formatQty(p?.qtyLos ?? null), p?.qtyLos ?? null), p?.groeiQtyLos ?? null, growth), styles: bold },
    {
      content: cell(
        blankIfNull(formatQty(p?.qtyProductie ?? null), p?.qtyProductie ?? null),
        p?.groeiQtyProductie ?? null,
        growth
      ),
      styles: bold,
    },
  ];
  if (!cat.gemengdeEenheden) {
    body.push([{ content: "Totaal aantal", colSpan: 2, styles: bold }, ...labels.flatMap((_, i) => qtyCells(cat.totalen[i]))]);
  }
  body.push(
    span("Aantal orders", (p) => [blankIfNull(formatInteger(p.aantalOrders), p.aantalOrders), p.groeiAantalOrders])
  );
  const omzetCells = (p: OmzetPeriode | undefined): PdfCell[] => [
    { content: cell(blankIfNull(formatMoney(p?.omzetLos ?? null), p?.omzetLos ?? null), p?.groeiOmzetLos ?? null, growth), styles: bold },
    {
      content: cell(
        blankIfNull(formatMoney(p?.omzetProductie ?? null), p?.omzetProductie ?? null),
        p?.groeiOmzetProductie ?? null,
        growth
      ),
      styles: bold,
    },
  ];
  body.push([{ content: "Omzet los / productie", colSpan: 2, styles: bold }, ...labels.flatMap((_, i) => omzetCells(cat.totalen[i]))]);
  body.push(span("Omzet totaal", (p) => [blankIfNull(formatMoney(p.omzetTotaal), p.omzetTotaal), p.groeiOmzetTotaal]));
  return { head, body, title: pdfTitle(cat.categorie) };
}

function omzetTable(sectie: OmzetSectie, labels: string[], growth: boolean): PdfTableModel {
  const row = (label: string, pick: (p: OmzetPeriode) => [string, number | null]): PdfCell[] => [
    label,
    ...labels.map((_, i) => {
      const p = sectie.omzet[i];
      const [t, g] = p ? pick(p) : ["", null];
      return cell(t, g, growth);
    }),
  ];
  return {
    head: [["Omzet", ...labels]],
    body: [
      row("Aantal orders", (p) => [blankIfNull(formatInteger(p.aantalOrders), p.aantalOrders), p.groeiAantalOrders]),
      row("Omzet los", (p) => [blankIfNull(formatMoney(p.omzetLos), p.omzetLos), p.groeiOmzetLos]),
      row("Omzet productie", (p) => [blankIfNull(formatMoney(p.omzetProductie), p.omzetProductie), p.groeiOmzetProductie]),
      row("Omzet totaal", (p) => [blankIfNull(formatMoney(p.omzetTotaal), p.omzetTotaal), p.groeiOmzetTotaal]),
    ],
  };
}

function metersTable(sectie: OmzetSectie, labels: string[]): PdfTableModel {
  const row = (label: string, values: number[]): PdfCell[] => [
    label,
    ...labels.map((_, i) => (values[i] === undefined ? "" : formatQty(values[i]))),
  ];
  return {
    head: [["Meters", ...labels]],
    body: [
      row("Ledstrip / Nomatrack", sectie.meters.ledstripNomatrack),
      row("Cover met licht", sectie.meters.coverLicht),
    ],
  };
}

export function buildPdfModel(response: OmzetanalyseResponse): PdfSectionModel[] {
  const labels = getKolomLabels(response);
  const growth = response.modus === "JAREN";
  return response.secties.map((sectie) => ({
    heading:
      sectie.dealerKlnr !== null ? `${sectie.dealerNaam ?? ""} (${sectie.dealerKlnr})`.trim() : null,
    tables: [
      ...sectie.categorieen.map((c) => categorieTable(c, labels, growth)),
      omzetTable(sectie, labels, growth),
      metersTable(sectie, labels),
    ],
  }));
}

export function buildPdfHeaderLines(response: OmzetanalyseResponse): string[] {
  const { filters } = response;
  const lines: string[] = [];
  lines.push(
    response.modus === "JAREN"
      ? "Jaarvergelijking"
      : `Periode: ${formatDate(filters.datumVan)} t/m ${formatDate(filters.datumTot)}`
  );
  const extra: string[] = [];
  if (filters.klnr !== null) extra.push(`Klant: ${filters.klnr} - ${filters.klantNaam ?? ""}`.trim());
  if (filters.soort) extra.push(`Soort: ${filters.soort} - ${filters.soortOmschr ?? ""}`.trim());
  if (filters.perDealer) extra.push("Afzonderlijke lijst per dealer");
  if (extra.length) lines.push(extra.join("  |  "));
  return lines;
}

const MIN_SPACE_AFTER_TITLE_MM = 30;

/** Renders the whole report into a landscape A4 jsPDF document. */
export function renderPdf(doc: jsPDF, response: OmzetanalyseResponse, now: Date = new Date()): void {
  const marginLeft = 15;
  const generatedAt = `Gegenereerd op: ${formatDate(now.toISOString())} ${now.toLocaleTimeString(
    "nl-BE",
    { hour: "2-digit", minute: "2-digit" }
  )}`;
  let y = drawNomaledHeader(doc, "Omzetanalyse dealers", buildPdfHeaderLines(response), generatedAt, marginLeft);

  const model = buildPdfModel(response);
  if (model.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...NOMA_DARK_GREY);
    doc.text("Geen data gevonden voor deze selectie", marginLeft, y + 6);
    return;
  }

  const finalY = () =>
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY;

  model.forEach((section, idx) => {
    if (idx > 0) {
      doc.addPage();
      y = 20;
    }
    if (section.heading) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...NOMA_DARK_GREY);
      doc.text(section.heading, marginLeft, y + 2);
      y += 6;
    }
    for (const table of section.tables) {
      if (table.title) {
        // Avoid an orphaned title at the bottom of a page.
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
      }
      autoTable(doc, {
        startY: y,
        head: table.head as never,
        body: table.body as never,
        margin: { left: marginLeft, right: marginLeft },
        styles: { font: "helvetica", fontSize: 8, overflow: "linebreak" },
        headStyles: { fillColor: NOMA_GREEN, textColor: WHITE, halign: "center" },
      });
      y = (finalY() ?? y) + 6;
    }
  });
}
