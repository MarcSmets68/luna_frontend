import { AppShell } from "@/components/layout/app-shell";
import { OmzetanalyseDealersPage } from "@/features/omzetanalyse-dealers/components/omzetanalyse-dealers-page";

type SearchParams = {
  focus?: string;
  tab?: string;
};

export default async function OmzetanalyseDealers({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  return (
    <AppShell>
      <OmzetanalyseDealersPage initialFocus={sp.focus} initialTab={sp.tab} />
    </AppShell>
  );
}
