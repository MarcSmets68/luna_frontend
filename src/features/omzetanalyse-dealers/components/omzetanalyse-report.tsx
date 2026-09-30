import type { OmzetanalyseResponse } from "@/lib/api-client";
import { getKolomLabels } from "../lib/omzetanalyse-format";
import { OmzetanalyseSectie } from "./omzetanalyse-sectie";

export function OmzetanalyseReport({ response }: { response: OmzetanalyseResponse }) {
  if (response.secties.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Geen data gevonden voor deze selectie</p>
    );
  }
  const kolomLabels = getKolomLabels(response);
  const showGrowth = response.modus === "JAREN";
  return (
    <div>
      {response.secties.map((sectie, i) => (
        <OmzetanalyseSectie
          key={sectie.dealerKlnr ?? `sectie-${i}`}
          sectie={sectie}
          kolomLabels={kolomLabels}
          showGrowth={showGrowth}
        />
      ))}
    </div>
  );
}
