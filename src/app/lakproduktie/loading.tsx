import { AppShell } from "@/components/layout/app-shell";
import { Progress } from "@/components/ui/progress";

/**
 * Next.js toont dit automatisch (via een impliciete Suspense-boundary om
 * page.tsx) zodra je naar /lakproduktie navigeert, terwijl GET
 * /web/lakproduktie nog loopt - zo blijft de shell/navigatie meteen
 * zichtbaar in plaats van een lege pagina tot de data binnen is. Sinds de
 * backend die call bedient vanuit een cache die elke 5 minuten op de
 * achtergrond ververst wordt (zie Backend/README.md
 * "Lakproduktie-cache" / Luna.BusinessLogic.LakproductieCacheService) is
 * dit normaal een korte flash; enkel bij een cold start (vlak na een
 * deploy, vóór de eerste geplande refresh) of een niet-leesbare cache kan
 * de live herberekening nog tot ~1 minuut duren. `value={null}` op
 * Progress geeft de onbepaalde ("indeterminate") sweep-animatie - er is
 * geen percentage beschikbaar, enkel dat het nog loopt.
 */
export default function LakproductieLoading() {
  return (
    <AppShell>
      <div className="flex h-full flex-col">
        <div className="mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          Productie
        </div>
        <div className="mb-6 flex items-baseline justify-between">
          <h1 className="text-[26px] font-bold text-foreground">Lakproduktie</h1>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm space-y-3 text-center">
            <Progress value={null} />
            <p className="text-sm text-muted-foreground">
              Orderregels worden geladen - dit kan even duren...
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
