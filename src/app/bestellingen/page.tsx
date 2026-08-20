import { AppShell } from "@/components/layout/app-shell";
import { BestellingenPage } from "@/features/bestellingen/components/bestellingen-page";
import {
  getBestelorders,
  type BestelorderSortDir,
  type BestelorderSortField,
} from "@/lib/api-client";

const PAGE_SIZE = 25;

export default async function Bestellingen({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    ordnr?: string;
    naam?: string;
    sortField?: string;
    sortDir?: string;
  }>;
}) {
  const { page: pageParam, ordnr, naam, sortField, sortDir } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const { items, hasMore } = await getBestelorders({
    page,
    pageSize: PAGE_SIZE,
    ordnr,
    naam,
    sortField: sortField as BestelorderSortField | undefined,
    sortDir: sortDir as BestelorderSortDir | undefined,
  });

  return (
    <AppShell>
      <BestellingenPage
        items={items}
        page={page}
        hasMore={hasMore}
        ordnr={ordnr ?? ""}
        naam={naam ?? ""}
        sortField={sortField === "datum" || sortField === "naam" || sortField === "stempel" ? sortField : "ordnr"}
        sortDir={sortDir === "asc" ? "asc" : "desc"}
      />
    </AppShell>
  );
}
