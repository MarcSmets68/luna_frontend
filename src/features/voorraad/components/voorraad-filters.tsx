"use client";

import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import type { OnderMinimumFilter } from "@/lib/api-client";

/**
 * FR-2 filters op de voorraad-lijstpagina. Bouwt de gedeelde `onderMinimum`
 * query-param op (intern/extern/beide, zie architectuurontwerp §1.2.1/§3.3)
 * uit twee losse checkboxes, en een aparte `externInBewerking` toggle.
 * Filters zijn server state via de URL - elke wijziging navigeert naar
 * pagina 1 met de nieuwe query-params, consistent met het bestaande
 * `page`-param-patroon.
 */
export function VoorraadFilters({
  onderMinimum,
  externInBewerking,
}: {
  onderMinimum?: OnderMinimumFilter;
  externInBewerking: boolean;
}) {
  const router = useRouter();

  const intern = onderMinimum === "intern" || onderMinimum === "beide";
  const extern = onderMinimum === "extern" || onderMinimum === "beide";

  function navigate(nextIntern: boolean, nextExtern: boolean, nextExternInBewerking: boolean) {
    const params = new URLSearchParams();
    params.set("page", "1");

    let nextOnderMinimum: OnderMinimumFilter | undefined;
    if (nextIntern && nextExtern) nextOnderMinimum = "beide";
    else if (nextIntern) nextOnderMinimum = "intern";
    else if (nextExtern) nextOnderMinimum = "extern";

    if (nextOnderMinimum) params.set("onderMinimum", nextOnderMinimum);
    if (nextExternInBewerking) params.set("externInBewerking", "true");

    router.push(`/voorraad?${params.toString()}`);
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-6">
      <label className="flex items-center gap-2 text-sm text-foreground">
        <Checkbox
          checked={intern}
          onCheckedChange={(checked) => navigate(checked === true, extern, externInBewerking)}
        />
        Onder minimum (intern)
      </label>
      <label className="flex items-center gap-2 text-sm text-foreground">
        <Checkbox
          checked={extern}
          onCheckedChange={(checked) => navigate(intern, checked === true, externInBewerking)}
        />
        Onder minimum (extern)
      </label>
      <label className="flex items-center gap-2 text-sm text-foreground">
        <Checkbox
          checked={externInBewerking}
          onCheckedChange={(checked) => navigate(intern, extern, checked === true)}
        />
        Extern in bewerking
      </label>
    </div>
  );
}
