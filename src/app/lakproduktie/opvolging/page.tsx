import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { LakorderWerklijst } from "@/features/lakproductie/components/lakorder-werklijst";
import { maakLakorderFixtures } from "@/features/lakproductie/lakorder-fixtures";
import { lakorderProefBeschikbaar } from "@/features/lakproductie/lakorder-proef";
import { brusselseDag, maakLakordersWerklijsten } from "@/features/lakproductie/lakorder-werklijst";

export default function LakorderOpvolgingPage() {
  if (!lakorderProefBeschikbaar()) notFound();

  const vandaag = brusselseDag(new Date());
  return (
    <AppShell>
      <LakorderWerklijst werklijsten={maakLakordersWerklijsten(maakLakorderFixtures(vandaag), vandaag)} />
    </AppShell>
  );
}
