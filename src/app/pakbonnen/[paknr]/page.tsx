import { AppShell } from "@/components/layout/app-shell";
import { PakbonDetailPage } from "@/features/pakbonnen/components/pakbon-detail-page";
import { PakbonNotFound } from "@/features/pakbonnen/components/pakbon-not-found";
import { getPakbon, getPaklijnen } from "@/lib/api-client";

export default async function PakbonDetail({
  params,
}: {
  params: Promise<{ paknr: string }>;
}) {
  const { paknr: paknrParam } = await params;
  const paknr = Number(paknrParam);

  if (!Number.isInteger(paknr) || paknr <= 0) {
    return (
      <AppShell>
        <PakbonNotFound paknr={paknrParam} />
      </AppShell>
    );
  }

  const pakbon = await getPakbon(paknr);

  if (!pakbon) {
    return (
      <AppShell>
        <PakbonNotFound paknr={paknrParam} />
      </AppShell>
    );
  }

  const paklijnen = await getPaklijnen(paknr);

  return (
    <AppShell>
      <PakbonDetailPage pakbon={pakbon} paklijnen={paklijnen} />
    </AppShell>
  );
}
