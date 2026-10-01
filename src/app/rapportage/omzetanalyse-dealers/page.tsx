import { AppShell } from "@/components/layout/app-shell";
import { ApiErrorMessage } from "@/components/error/api-error-message";
import { OmzetanalyseDealersPage } from "@/features/omzetanalyse-dealers/components/omzetanalyse-dealers-page";
import { getOmzetanalyseSoorten } from "@/lib/api-client";

type SearchParams = {
  datumVan?: string;
  datumTot?: string;
  klnr?: string;
  soort?: string;
  perDealer?: string;
  uitvoeren?: string;
};

export default async function OmzetanalyseDealers({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  let soorten;
  try {
    ({ items: soorten } = await getOmzetanalyseSoorten());
  } catch (error) {
    return <ApiErrorMessage error={error} pageName="omzetanalyse dealers" />;
  }

  const klnrNum = Number(sp.klnr);
  const soort = sp.soort ?? "";
  const filters = {
    datumVan: sp.datumVan ?? "",
    datumTot: sp.datumTot ?? "",
    klnr: sp.klnr && Number.isFinite(klnrNum) ? klnrNum : null,
    klantNaam: null,
    soort,
    perDealer: !!soort && sp.perDealer === "true",
  };

  const queryString = new URLSearchParams(
    Object.entries(sp).filter((e): e is [string, string] => typeof e[1] === "string")
  ).toString();

  return (
    <AppShell>
      <OmzetanalyseDealersPage
        soorten={soorten}
        filters={filters}
        uitvoeren={sp.uitvoeren === "1"}
        queryString={queryString}
      />
    </AppShell>
  );
}
