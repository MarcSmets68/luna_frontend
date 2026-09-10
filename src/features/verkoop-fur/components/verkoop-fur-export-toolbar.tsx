"use client";

import { useState } from "react";
import { FileDown, FileSpreadsheet, Loader2 } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "@/components/ui/button";
import type { VerkoopFurItem } from "@/lib/api-client";
import { formatDate } from "../lib/verkoop-fur-format";
import {
  PDF_TABLE_HEADERS,
  buildCsvContent,
  buildExportFileBaseName,
  buildPdfTableRows,
} from "../lib/verkoop-fur-export";

// Noma brand colors, see docs/design-system.md §2.1/§2.3.
const NOMA_DARK_GREY: [number, number, number] = [37, 45, 47]; // #252d2f
const NOMA_GREEN: [number, number, number] = [96, 161, 114]; // #60a172
const NEUTRAL_600: [number, number, number] = [99, 120, 126]; // #63787e
const WHITE: [number, number, number] = [255, 255, 255];

/**
 * Triggers a client-side download of `content` as a file named `fileName`,
 * via a temporary anchor element - the standard dependency-free browser
 * download pattern (no server round-trip).
 */
function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function generatePdf(
  items: VerkoopFurItem[],
  periodeVan: string,
  periodeTot: string
): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const marginLeft = 15;
  let y = 18;

  // Nomaled wordmark, replicating sidebar.tsx's styled-text treatment.
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
  doc.text("Verkoop FUR", marginLeft, y);

  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...NOMA_DARK_GREY);
  doc.text(`Periode: ${formatDate(periodeVan)} t/m ${formatDate(periodeTot)}`, marginLeft, y);

  y += 6;
  doc.setFontSize(8);
  doc.setTextColor(...NEUTRAL_600);
  const now = new Date();
  const generatedAtLabel = `Gegenereerd op: ${formatDate(now.toISOString())} ${now.toLocaleTimeString(
    "nl-BE",
    { hour: "2-digit", minute: "2-digit" }
  )}`;
  doc.text(generatedAtLabel, marginLeft, y);

  y += 6;

  if (items.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...NOMA_DARK_GREY);
    doc.text("Geen dealers gevonden in deze periode", marginLeft, y + 6);
  } else {
    autoTable(doc, {
      startY: y,
      head: [[...PDF_TABLE_HEADERS]],
      body: buildPdfTableRows(items),
      styles: { font: "helvetica", overflow: "linebreak" },
      headStyles: { fillColor: NOMA_GREEN, textColor: WHITE },
    });
  }

  return doc;
}

export function VerkoopFurExportToolbar({
  items,
  periodeVan,
  periodeTot,
}: {
  items: VerkoopFurItem[];
  periodeVan: string;
  periodeTot: string;
}) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  function handlePdfExport() {
    setIsGeneratingPdf(true);
    try {
      const doc = generatePdf(items, periodeVan, periodeTot);
      const blob = doc.output("blob");
      downloadBlob(blob, `${buildExportFileBaseName()}.pdf`);
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  function handleCsvExport() {
    const content = buildCsvContent(items, periodeVan, periodeTot);
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `${buildExportFileBaseName()}.csv`);
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isGeneratingPdf}
        onClick={handlePdfExport}
      >
        {isGeneratingPdf ? <Loader2 className="animate-spin" /> : <FileDown />}
        {isGeneratingPdf ? "Bezig..." : "PDF"}
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={handleCsvExport}>
        <FileSpreadsheet />
        CSV
      </Button>
    </div>
  );
}
