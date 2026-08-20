import { AppShell } from "@/components/layout/app-shell";
import { BonDetailPage } from "@/features/orders/components/bon-detail-page";
import { BonNotFound } from "@/features/orders/components/bon-not-found";
import { getBon, getBonLijnen } from "@/lib/api-client";

export default async function OrderDetail({
  params,
}: {
  params: Promise<{ bonnr: string }>;
}) {
  const { bonnr: bonnrParam } = await params;
  const bonnr = Number(bonnrParam);

  if (!Number.isInteger(bonnr) || bonnr <= 0) {
    return (
      <AppShell>
        <BonNotFound bonnr={bonnrParam} />
      </AppShell>
    );
  }

  const bon = await getBon(bonnr);

  if (!bon) {
    return (
      <AppShell>
        <BonNotFound bonnr={bonnrParam} />
      </AppShell>
    );
  }

  const lijnen = await getBonLijnen(bonnr);

  return (
    <AppShell>
      <BonDetailPage bon={bon} lijnen={lijnen} />
    </AppShell>
  );
}
