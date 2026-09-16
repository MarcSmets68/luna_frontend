import { AppShell } from "@/components/layout/app-shell";
import { ApiErrorMessage } from "@/components/error/api-error-message";
import { KlantenPage } from "@/features/klanten/components/klanten-page";
import { getKlanten } from "@/lib/api-client";

const PAGE_SIZE = 25;

export default async function Klanten({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; naam?: string; nomaled?: string }>;
}) {
  const { page: pageParam, naam, nomaled } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const nomaledOnly = nomaled === "true";

  let items, hasMore;
  try {
    ({ items, hasMore } = await getKlanten({ naam, page, pageSize: PAGE_SIZE, nomaled: nomaledOnly }));
  } catch (error) {
    return <ApiErrorMessage error={error} pageName="klanten" />;
  }

  return (
    <AppShell>
      <KlantenPage items={items} page={page} hasMore={hasMore} naam={naam ?? ""} nomaled={nomaledOnly} />
    </AppShell>
  );
}
