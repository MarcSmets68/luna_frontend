import { getVerkoopsanalyse, type VerkoopsanalyseResponse } from "@/lib/api-client";
import { GrowthBadge } from "@/features/omzetanalyse-dealers/components/growth-badge";
import { formatDate, formatMoney, formatQty } from "@/features/omzetanalyse-dealers/lib/omzetanalyse-format";
import {
  dealersLabel,
  groei,
  heeftGemengdeEenheden,
  rijLabel,
  sommeer,
  totaalAantalZinvol,
  type VerkoopsanalyseSelectie,
} from "../lib/verkoopsanalyse-model";
import { VerkoopsanalyseExportToolbar } from "./verkoopsanalyse-export-toolbar";
import { VerkoopsanalyseMaandChart } from "./verkoopsanalyse-maand-chart";
import { VerkoopsanalyseMaandTable } from "./verkoopsanalyse-maand-table";

/** Async server component: fetches the analysis; rendered inside <Suspense>. */
export async function VerkoopsanalyseResults({ selectie }: { selectie: VerkoopsanalyseSelectie }) {
  let response: VerkoopsanalyseResponse;
  try {
    response = await getVerkoopsanalyse(selectie);
  } catch (error) {
    return (
      <div role="alert" className="rounded-md border border-destructive/30 p-4">
        <p className="text-sm font-semibold text-destructive">De analyse kon niet geladen worden</p>
        <p className="mt-1 font-mono text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "Onbekende fout"}
        </p>
      </div>
    );
  }

  return <VerkoopsanalyseView response={response} gekozenDealers={selectie.klnrs.length} />;
}

/** Presentational part, split off so it can be tested without the API. */
export function VerkoopsanalyseView({
  response,
  gekozenDealers,
}: {
  response: VerkoopsanalyseResponse;
  gekozenDealers: number;
}) {
  const totaal = sommeer(response.totaal);
  const gemengd = heeftGemengdeEenheden(response.rijen);
  const metAantal = totaalAantalZinvol(response.rijen);
  const eenheid = metAantal ? (response.rijen[0]?.eenheid ?? null) : null;
  const leeg = totaal.omzet === 0 && totaal.omzetVorigJaar === 0 && totaal.aantal === 0 && totaal.aantalVorigJaar === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="text-[13px] text-muted-foreground">
          <div>
            <span className="font-medium text-foreground">
              {formatDate(response.periodeVan)} t/m {formatDate(response.periodeTot)}
            </span>{" "}
            vergeleken met {formatDate(response.vorigePeriodeVan)} t/m {formatDate(response.vorigePeriodeTot)}
          </div>
          <div>{dealersLabel(response, gekozenDealers)}</div>
        </div>
        {!leeg && <VerkoopsanalyseExportToolbar response={response} gekozenDealers={gekozenDealers} />}
      </div>

      {leeg ? (
        <p className="border border-border bg-card p-4 text-sm text-muted-foreground">
          Geen verkoop gevonden voor deze selectie, ook niet in het jaar ervoor.
        </p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Kpi
              label="Omzet afgelopen 12 maanden"
              waarde={`€ ${formatMoney(totaal.omzet)}`}
              vorig={`€ ${formatMoney(totaal.omzetVorigJaar)}`}
              groeiWaarde={groei(totaal.omzet, totaal.omzetVorigJaar)}
            />
            {metAantal && (
              <Kpi
                label={`Aantal${eenheid ? ` (${eenheid})` : ""}`}
                waarde={formatQty(totaal.aantal)}
                vorig={formatQty(totaal.aantalVorigJaar)}
                groeiWaarde={groei(totaal.aantal, totaal.aantalVorigJaar)}
              />
            )}
            {gemengd && (
              <div className="border border-border bg-card p-4 text-[12px] text-muted-foreground">
                De gekozen artikelen hebben verschillende eenheden (meter en stuk). Het totale aantal
                wordt daarom niet opgeteld; je vindt de aantallen per artikel hieronder.
              </div>
            )}
          </div>

          <VerkoopsanalyseMaandChart maanden={response.totaal} />

          <section>
            <h2 className="mb-2 text-[15px] font-semibold text-foreground">Per maand</h2>
            <VerkoopsanalyseMaandTable maanden={response.totaal} metAantal={metAantal} eenheid={eenheid} />
          </section>

          {response.rijen.length > 1 && (
            <section>
              <h2 className="mb-2 text-[15px] font-semibold text-foreground">Per artikel</h2>
              <div className="space-y-2">
                {response.rijen.map((rij) => {
                  const t = sommeer(rij.maanden);
                  return (
                    <details key={`${rij.artnr}${rij.swBegins ? "*" : ""}`} className="group border border-border bg-card">
                      <summary className="flex cursor-pointer flex-wrap items-baseline gap-x-4 gap-y-1 px-4 py-2.5 text-[13px]">
                        <span className="min-w-48 flex-1">
                          <span className="font-semibold">{rijLabel(rij)}</span>
                          {rij.omschrijving && <span className="ml-2 text-muted-foreground">{rij.omschrijving}</span>}
                        </span>
                        <span className="tabular-nums">
                          {formatQty(t.aantal)} {rij.eenheid ?? ""}
                          <GrowthBadge value={groei(t.aantal, t.aantalVorigJaar)} />
                        </span>
                        <span className="w-36 text-right tabular-nums">
                          € {formatMoney(t.omzet)}
                          <GrowthBadge value={groei(t.omzet, t.omzetVorigJaar)} />
                        </span>
                      </summary>
                      <div className="border-t border-border px-2 pb-2">
                        <VerkoopsanalyseMaandTable maanden={rij.maanden} metAantal eenheid={rij.eenheid} />
                      </div>
                    </details>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function Kpi({
  label,
  waarde,
  vorig,
  groeiWaarde,
}: {
  label: string;
  waarde: string;
  vorig: string;
  groeiWaarde: number | null;
}) {
  return (
    <div className="border border-border bg-card p-4">
      <div className="text-[12px] font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 text-[22px] font-bold text-foreground tabular-nums">{waarde}</div>
      <div className="mt-0.5 flex items-baseline gap-2 text-[12px] text-muted-foreground">
        <span>Vorig jaar {vorig}</span>
        <GrowthBadge value={groeiWaarde} />
      </div>
    </div>
  );
}

export function VerkoopsanalyseResultsSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" data-testid="results-skeleton">
      <p className="text-sm text-muted-foreground">Analyse wordt gemaakt - dit kan even duren...</p>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-8 animate-pulse rounded-md bg-muted" />
      ))}
    </div>
  );
}
