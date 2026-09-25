"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import type { BoxOverzichtArticle } from "../types";

/**
 * Print-only label content for a single article. No second backend call:
 * `article` is whatever BoxArticleRow already had from the original
 * GET /npp/boxoverzicht response. Rendered hidden on screen and only
 * shown to the print engine (print:* utility classes), then triggers
 * window.print() once mounted with an article. When `article.barcode`
 * is "" the barcode graphic is omitted entirely (artnr/omschrijving/
 * aantal only) rather than rendering a broken/empty barcode.
 */
export function BoxLabelPrintView({
  article,
  onPrinted,
}: {
  article: BoxOverzichtArticle | null;
  onPrinted: () => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!article) return;

    if (article.barcode && svgRef.current) {
      JsBarcode(svgRef.current, article.barcode, {
        format: "CODE128",
        displayValue: false,
        height: 60,
        margin: 8,
      });
    }

    const handleAfterPrint = () => onPrinted();
    window.addEventListener("afterprint", handleAfterPrint);
    window.print();

    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, [article, onPrinted]);

  if (!article) return null;

  return (
    <div className="hidden print:fixed print:inset-0 print:z-50 print:flex print:flex-col print:items-center print:justify-center print:bg-white print:text-black">
      {article.barcode ? (
        <svg ref={svgRef} role="img" aria-label={"Barcode " + article.barcode} />
      ) : null}
      <div className="mt-2 text-center">
        <div className="text-lg font-semibold">{article.artnr}</div>
        <div className="text-sm">{article.omschrijving}</div>
        <div className="text-sm">Aantal: {article.aantal}</div>
      </div>
    </div>
  );
}
