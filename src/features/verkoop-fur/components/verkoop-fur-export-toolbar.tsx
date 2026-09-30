"use client";

import { useState } from "react";
import { FileDown, FileSpreadsheet, Loader2 } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "@/components/ui/button";
import type { VerkoopFurItem } from "@/lib/api-client";
import { downloadBlob } from "@/lib/export/download";
import { NOMA_DARK_GREY, NOMA_GREEN, WHITE, drawNomaledHeader } from "@/lib/export/pdf-header";
import { formatDate } from "../lib/verkoop-fur-format";
import {
  PDF_TABLE_HEADERS,
  buildCsvContent,
  buildExportFileBaseName,
  buildPdfTableRows,
} from "../lib/verkoop-fur-export";

function generatePdf(
  items: VerkoopFurItem[],
  periodeVan: string,
  periodeTot: string
): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const marginLeft = 15;

  const now = new Date();
  const generatedAtLabel = `Gegenereerd op: ${formatDate(now.toISOString())} ${now.toLocaleTimeString(
    "nl-BE",
    { hour: "2-digit", minute: "2-digit" }
  )}`;
  const y = drawNomaledHeader(
    doc,
    "Verkoop FUR",
    [`Periode: ${formatDate(periodeVan)} t/m ${formatDate(periodeTot)}`],
    generatedAtLabel,
    marginLeft
  );

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
