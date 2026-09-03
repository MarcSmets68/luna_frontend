import { AppShell } from "@/components/layout/app-shell";
import { Progress } from "@/components/ui/progress";

/**
 * Zelfde patroon als Frontend/src/app/lakproduktie/loading.tsx: Next.js
 * toont dit automatisch terwijl GET /web/rapportage/verkoop-fur nog
 * loopt. Dit endpoint is niet gecached (zie verkoop-fur-ontwerp.md, Open
 * flags #2), dus dit is elke keer een live herberekening - meestal kort
 * (indexed artnr-prefix-first query), maar `value={null}` geeft de
 * onbepaalde ("indeterminate") sweep-animatie omdat er geen percentage
 * beschikbaar is.
 */
export default function VerkoopFurLoading() {
  return (
    <AppShell>
      <div className="flex h-full flex-col">
        <div className="mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          Rapportage
        </div>
        <div className="mb-6 flex items-baseline justify-between">
          <h1 className="text-[26px] font-bold text-foreground">Verkoop FUR</h1>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm space-y-3 text-center">
            <Progress value={null} />
            <p className="text-sm text-muted-foreground">
              Rapport wordt geladen - dit kan even duren...
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
