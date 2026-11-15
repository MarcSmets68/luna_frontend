"use client";

import { useState } from "react";
import { FileDown, FileSpreadsheet, Loader2 } from "lucide-react";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import type { VerkoopsanalyseResponse } from "@/lib/api-client";
import { downloadBlob } from "@/lib/export/download";
import { buildCsvContent, buildExportFileBaseName, renderPdf } from "../lib/verkoopsanalyse-export";

export function VerkoopsanalyseExportToolbar({
  response,
  gekozenDealers,
}: {
  response: VerkoopsanalyseResponse;
  gekozenDealers: number;
}) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  async function handlePdfExport() {
    setIsGeneratingPdf(true);
    try {
      // Let React paint the loading state before the synchronous PDF work.
      await new Promise((resolve) => setTimeout(resolve, 0));
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      renderPdf(doc, response, gekozenDealers);
      downloadBlob(doc.output("blob"), `${buildExportFileBaseName()}.pdf`);
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  function handleCsvExport() {
    const blob = new Blob([buildCsvContent(response, gekozenDealers)], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `${buildExportFileBaseName()}.csv`);
  }

  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="outline" size="sm" disabled={isGeneratingPdf} onClick={handlePdfExport}>
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
