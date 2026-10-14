import { AppShell } from "@/components/layout/app-shell";
import { RapportageLandingPage } from "@/features/rapportage/components/rapportage-landing-page";
import { OMZETANALYSE_PARAMS } from "@/features/omzetanalyse-dealers/components/omzetanalyse-dealers-page";
import { getOmzetanalyseDealers } from "@/lib/api-client";

export default function Rapportage() {
  // Warm the fetch cache: the omzetanalyse query takes ~20s on the backend -
  // kicking it off here (fire-and-forget) means the report page is instant
  // when the user clicks through within the 5-minute cache window.
  void getOmzetanalyseDealers(OMZETANALYSE_PARAMS).catch(() => {});

  return (
    <AppShell>
      <RapportageLandingPage />
    </AppShell>
  );
}
