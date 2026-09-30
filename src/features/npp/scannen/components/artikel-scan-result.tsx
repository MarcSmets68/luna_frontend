import type { ArtikelScanArticle } from "../types";

/**
 * Resolved-article display for a single scan match. `aantal` is only
 * rendered when present (populated when the scan used the
 * "<nummer>-<aantal>" picking form) - see api-client's ArtikelScanArticle.
 */
export function ArtikelScanResult({ article }: { article: ArtikelScanArticle }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-foreground">{article.artnr}</h2>
        <span className="text-sm text-muted-foreground">{article.xref}</span>
      </div>
      <p className="mt-2 text-sm text-foreground">{article.omschrijving}</p>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">Barcode</dt>
          <dd className="text-foreground">{article.barcode}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Pickingkode</dt>
          <dd className="text-foreground">{article.pickingkode}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Pickingkleur</dt>
          <dd className="text-foreground">{article.pickingkleur}</dd>
        </div>
        {article.aantal !== undefined && (
          <div>
            <dt className="text-muted-foreground">Aantal</dt>
            <dd className="text-foreground">{article.aantal}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
