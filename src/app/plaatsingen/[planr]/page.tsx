import { AppShell } from "@/components/layout/app-shell";
import { PlaatsingDetailPage } from "@/features/plaatsingen/components/plaatsing-detail-page";
import { PlaatsingNotFound } from "@/features/plaatsingen/components/plaatsing-not-found";
import { getMockPlaatsing } from "@/features/plaatsingen/data/mock-plaatsingen";

export default async function PlaatsingDetail({
  params,
}: {
  params: Promise<{ planr: string }>;
}) {
  const { planr: planrParam } = await params;
  const planr = Number(planrParam);

  if (!Number.isInteger(planr) || planr <= 0) {
    return (
      <AppShell>
        <PlaatsingNotFound planr={planrParam} />
      </AppShell>
    );
  }

  const plaatsing = await getMockPlaatsing(planr);

  if (!plaatsing) {
    return (
      <AppShell>
        <PlaatsingNotFound planr={planrParam} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PlaatsingDetailPage plaatsing={plaatsing} />
    </AppShell>
  );
}
