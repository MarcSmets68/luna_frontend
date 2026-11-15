import type { VerkoopMaand } from "@/lib/api-client";
import { formatMoney } from "@/features/omzetanalyse-dealers/lib/omzetanalyse-format";
import { maandLabel, vorigJaarLabel } from "../lib/verkoopsanalyse-model";

/**
 * Omzet per month as paired bars: the same month last year (muted) next to
 * this year (brand colour). Plain divs, no chart library; the exact values
 * are in the table below and in each bar's title.
 */
export function VerkoopsanalyseMaandChart({ maanden }: { maanden: VerkoopMaand[] }) {
  const max = Math.max(1, ...maanden.flatMap((m) => [m.omzet, m.omzetVorigJaar]));
  const hoogte = (v: number) => `${Math.max(0, (v / max) * 100)}%`;

  return (
    <figure className="border border-border bg-card p-4">
      <figcaption className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[13px] font-semibold text-foreground">Omzet per maand</span>
        <span className="flex gap-4 text-[12px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block size-2.5 bg-muted-foreground/30" aria-hidden="true" /> Vorig jaar
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block size-2.5 bg-primary" aria-hidden="true" /> Afgelopen 12 maanden
          </span>
        </span>
      </figcaption>
      <div className="flex h-48 items-end gap-1 sm:gap-2" role="img" aria-label="Staafgrafiek van de omzet per maand, vergeleken met vorig jaar">
        {maanden.map((m) => (
          <div key={m.maand} className="flex h-full min-w-0 flex-1 items-end justify-center gap-0.5">
            <div
              className="w-1/2 max-w-4 bg-muted-foreground/30"
              style={{ height: hoogte(m.omzetVorigJaar) }}
              title={`${vorigJaarLabel(m.maand)}: € ${formatMoney(m.omzetVorigJaar)}`}
            />
            <div
              className="w-1/2 max-w-4 bg-primary"
              style={{ height: hoogte(m.omzet) }}
              title={`${maandLabel(m.maand)}: € ${formatMoney(m.omzet)}`}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1 sm:gap-2">
        {maanden.map((m) => (
          <div key={m.maand} className="min-w-0 flex-1 truncate text-center text-[10px] text-muted-foreground sm:text-[11px]">
            {maandLabel(m.maand).split(" ")[0]}
          </div>
        ))}
      </div>
    </figure>
  );
}
