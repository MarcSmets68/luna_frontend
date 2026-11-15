import { AppShell } from "@/components/layout/app-shell";
import { VerkoopsanalysePage } from "@/features/verkoopsanalyse/components/verkoopsanalyse-page";
import type { VerkoopsanalyseSearchParams } from "@/features/verkoopsanalyse/lib/verkoopsanalyse-model";

export default async function Verkoopsanalyse({
  searchParams,
}: {
  searchParams: Promise<VerkoopsanalyseSearchParams>;
}) {
  const sp = await searchParams;

  return (
    <AppShell>
      <VerkoopsanalysePage searchParams={sp} />
    </AppShell>
  );
}
