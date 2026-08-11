import { AppShell } from "@/components/layout/app-shell";
import { FactuurDetailPage } from "@/features/facturatie/components/factuur-detail-page";
import { FactuurNotFound } from "@/features/facturatie/components/factuur-not-found";
import { getFactuur } from "@/lib/api-client";

export default async function FactuurDetail({
  params,
}: {
  params: Promise<{ facnr: string }>;
}) {
  const { facnr: facnrParam } = await params;
  const facnr = Number(facnrParam);

  if (!Number.isInteger(facnr) || facnr <= 0) {
    return (
      <AppShell>
        <FactuurNotFound facnr={facnrParam} />
      </AppShell>
    );
  }

  const factuur = await getFactuur(facnr);

  if (!factuur) {
    return (
      <AppShell>
        <FactuurNotFound facnr={facnrParam} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <FactuurDetailPage factuur={factuur} />
    </AppShell>
  );
}
