import { AppShell } from "@/components/layout/app-shell";
import { BestellingDetailPage } from "@/features/bestellingen/components/bestelling-detail-page";
import { BestellingNotFound } from "@/features/bestellingen/components/bestelling-not-found";
import { getBestelorder, getBestelorderLijnen } from "@/lib/api-client";

export default async function BestellingDetail({
  params,
}: {
  params: Promise<{ ordnr: string }>;
}) {
  const { ordnr: ordnrParam } = await params;
  const ordnr = Number(ordnrParam);

  if (!Number.isInteger(ordnr) || ordnr <= 0) {
    return (
      <AppShell>
        <BestellingNotFound ordnr={ordnrParam} />
      </AppShell>
    );
  }

  const bestelling = await getBestelorder(ordnr);

  if (!bestelling) {
    return (
      <AppShell>
        <BestellingNotFound ordnr={ordnrParam} />
      </AppShell>
    );
  }

  const lijnen = await getBestelorderLijnen(ordnr);

  return (
    <AppShell>
      <BestellingDetailPage bestelling={bestelling} lijnen={lijnen} />
    </AppShell>
  );
}
