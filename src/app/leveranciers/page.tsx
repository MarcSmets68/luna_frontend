import { AppShell } from "@/components/layout/app-shell";
import { ApiErrorMessage } from "@/components/error/api-error-message";
import { LeveranciersPage } from "@/features/leveranciers/components/leveranciers-page";
import { getLeveranciers } from "@/lib/api-client";

const PAGE_SIZE = 25;

export default async function Leveranciers({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; naam?: string }>;
}) {
  const { page: pageParam, naam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  
  let items, hasMore;
  try {
    ({ items, hasMore } = await getLeveranciers({ naam, page, pageSize: PAGE_SIZE }));
  } catch (error) {
    return <ApiErrorMessage error={error} pageName="leveranciers" />;
  }

  return (
    <AppShell>
      <LeveranciersPage items={items} page={page} hasMore={hasMore} naam={naam ?? ""} />
    </AppShell>
  );
}
