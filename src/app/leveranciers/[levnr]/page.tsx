import { AppShell } from "@/components/layout/app-shell";
import { LeverancierDetailPage } from "@/features/leveranciers/components/leverancier-detail-page";
import { LeverancierNotFound } from "@/features/leveranciers/components/leverancier-not-found";
import { getLeverancier } from "@/lib/api-client";

export default async function LeverancierDetail({
  params,
}: {
  params: Promise<{ levnr: string }>;
}) {
  const { levnr: levnrParam } = await params;
  const levnr = Number(levnrParam);

  if (!Number.isInteger(levnr) || levnr <= 0) {
    return (
      <AppShell>
        <LeverancierNotFound levnr={levnrParam} />
      </AppShell>
    );
  }

  const leverancier = await getLeverancier(levnr);

  if (!leverancier) {
    return (
      <AppShell>
        <LeverancierNotFound levnr={levnrParam} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <LeverancierDetailPage leverancier={leverancier} />
    </AppShell>
  );
}
