import { unstable_rethrow } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ApiErrorMessage } from "@/components/error/api-error-message";
import { ProductieplanningPage } from "@/features/productieplanning/components/productieplanning-page";
import {
  fromLak,
  fromLedMontage,
  type Afdeling,
} from "@/features/productieplanning/lib/build-planning";
import { getLakproductieItems, getPlanningQueue } from "@/lib/api-client";

export const dynamic = "force-dynamic";

function errorMessage(reason: unknown): string {
  return reason instanceof Error ? reason.message : "Onbekende fout";
}

export default async function Planning() {
  const [led, lak] = await Promise.allSettled([getPlanningQueue(), getLakproductieItems()]);

  if (led.status === "rejected") unstable_rethrow(led.reason);
  if (lak.status === "rejected") unstable_rethrow(lak.reason);

  if (led.status === "rejected" && lak.status === "rejected") {
    return <ApiErrorMessage error={led.reason} pageName="de planning" />;
  }

  const errors: { afdeling: Afdeling; message: string }[] = [];
  if (led.status === "rejected") errors.push({ afdeling: "led-montage", message: errorMessage(led.reason) });
  if (lak.status === "rejected") errors.push({ afdeling: "lak", message: errorMessage(lak.reason) });

  const entries = [
    ...(led.status === "fulfilled" ? fromLedMontage(led.value.items) : []),
    ...(lak.status === "fulfilled" ? fromLak(lak.value) : []),
  ];

  return (
    <AppShell>
      <ProductieplanningPage entries={entries} errors={errors} />
    </AppShell>
  );
}
