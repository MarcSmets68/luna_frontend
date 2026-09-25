"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BoxOverzichtArticle } from "../types";

/**
 * Single article row: artnr/omschrijving/aantal plus a "Print label"
 * action. Printing never triggers a second backend call - it hands the
 * already-fetched `article` straight to BoxLabelPrintView via `onPrint`.
 */
export function BoxArticleRow({
  article,
  onPrint,
}: {
  article: BoxOverzichtArticle;
  onPrint: (article: BoxOverzichtArticle) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="min-w-0">
        <div className="font-medium text-foreground">{article.artnr}</div>
        <div className="truncate text-sm text-muted-foreground">{article.omschrijving}</div>
        <div className="text-sm text-foreground">Aantal: {article.aantal}</div>
      </div>
      <Button
        type="button"
        variant="outline"
        aria-label={"Print label voor " + article.artnr}
        className="h-11 min-w-11 shrink-0 rounded-xl px-4"
        onClick={() => onPrint(article)}
      >
        <Printer className="size-4" />
        Print label
      </Button>
    </div>
  );
}
