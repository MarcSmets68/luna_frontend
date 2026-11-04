"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWorkflow } from "../hooks/use-workflow";
import { ActiviteitenLog } from "./activiteiten-log";
import { LijnScanScreen } from "./lijn-scan-screen";
import { ProductielijstTab } from "./productielijst-tab";
import { ReservatielijstTab } from "./reservatielijst-tab";

export function ReservatieMockup() {
  const { state, dispatch } = useWorkflow();
  const actieveLijn = state.lijnen.find((l) => l.id === state.activeLijnId) ?? null;

  if (actieveLijn) {
    return (
      <div className="flex w-full flex-col">
        <LijnScanScreen
          lijn={actieveLijn}
          activeOnderdeelId={state.activeOnderdeelId}
          aantal={state.aantal}
          batch={state.batch}
          pogingen={state.pogingen}
          foutmelding={state.foutmelding}
          leidinggevendeVerwittigd={state.leidinggevendeVerwittigd}
          tekortDialogOpen={state.tekortDialogOpen}
          tellenDialogOpen={state.tellenDialogOpen}
          onScanJuist={(onderdeelId) => dispatch({ type: "SCAN_JUIST", onderdeelId })}
          onScanFout={(omschrijving) => dispatch({ type: "SCAN_FOUT", omschrijving })}
          onAckLeidinggevende={() => dispatch({ type: "ACK_LEIDINGGEVENDE" })}
          onAantalChange={(aantal) => dispatch({ type: "SET_AANTAL", aantal })}
          onBatchChange={(batch) => dispatch({ type: "SET_BATCH", batch })}
          onBevestigAantal={() => dispatch({ type: "BEVESTIG_AANTAL" })}
          onOngedaanMaken={(onderdeelId) => dispatch({ type: "ONGEDAAN_MAKEN", onderdeelId })}
          onFysiekAanwezig={(aanwezig) => dispatch({ type: "FYSIEK_AANWEZIG", aanwezig })}
          onSluitTekortDialog={() => dispatch({ type: "SLUIT_TEKORT_DIALOG" })}
          onBevestigTelling={(geteld, reden, toelichting) =>
            dispatch({ type: "BEVESTIG_TELLING", geteld, reden, toelichting })
          }
          onNaarProductielijst={() => dispatch({ type: "NAAR_PRODUCTIELIJST" })}
          onMateriaalOntvangen={(onderdeelId) =>
            dispatch({ type: "MATERIAAL_ONTVANGEN", lijnId: actieveLijn.id, onderdeelId })
          }
          onTerug={() => dispatch({ type: "SLUIT_LIJN" })}
        />
        <div className="px-6 pb-8 sm:px-8">
          <ActiviteitenLog log={state.log} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6 p-6 sm:p-8">
      <div>
        <h1 className="font-heading text-xl font-semibold text-foreground">
          Reservatie van onderdelen (mockup)
        </h1>
        <p className="text-sm text-muted-foreground">
          Doorloop de scan-workflow per armatuur: scannen, aantallen bevestigen,
          tekorten afhandelen en afronden met eindcontrole.
        </p>
      </div>

      <Tabs defaultValue="reservatielijst">
        <TabsList>
          <TabsTrigger value="reservatielijst">Reservatielijst</TabsTrigger>
          <TabsTrigger value="productielijst">Productielijst</TabsTrigger>
        </TabsList>
        <TabsContent value="reservatielijst">
          <ReservatielijstTab
            lijnen={state.lijnen}
            onOpen={(lijnId) => dispatch({ type: "SELECT_LIJN", lijnId })}
          />
        </TabsContent>
        <TabsContent value="productielijst">
          <ProductielijstTab
            lijnen={state.lijnen}
            onScanOpenOnderdeel={(lijnId, onderdeelId) =>
              dispatch({ type: "SCAN_OPEN_ONDERDEEL", lijnId, onderdeelId })
            }
            onAfronden={(lijnId) => dispatch({ type: "AFROND_PRODUCTIE", lijnId })}
          />
        </TabsContent>
      </Tabs>

      <ActiviteitenLog log={state.log} />
    </div>
  );
}
