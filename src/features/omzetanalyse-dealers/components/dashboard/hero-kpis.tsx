import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatGrowth, formatInteger } from "../../lib/omzetanalyse-format";
import type { HeroData } from "../../lib/dashboard-aggregations";
import type { OmzetType } from "../../lib/dashboard-types";
import { CaveatFootnote, CaveatIcon } from "./omzet-caveat";

const TYPE_LABEL: Record<OmzetType, string> = {
  totaal: "Totale omzet",
  los: "Omzet los",
  productie: "Omzet productie",
};

export function HeroKpis({
  hero,
  type,
  focusLabel,
  isYtd,
}: {
  hero: HeroData;
  type: OmzetType;
  focusLabel: string;
  isYtd: boolean;
}) {
  return (
    <div>
      <Card className="rounded-none border-border shadow-none">
        <CardContent className="px-5 py-4">
          <div className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
            {TYPE_LABEL[type]} {focusLabel}
            {isYtd ? " (tot nu toe)" : ""} <CaveatIcon />
          </div>
          <div className="mt-1 flex flex-wrap items-baseline gap-3">
            <span data-testid="hero-value" className="text-[40px] font-bold text-foreground">
              {"\u20AC\u00A0"}
              {formatInteger(hero.value)}
            </span>
            {hero.mode === "jaren" && hero.deltaPct !== null && (
              <span
                data-testid="hero-delta"
                className={cn("text-sm font-semibold", hero.deltaPct < 0 ? "text-destructive" : "text-success-fg")}
              >
                {formatGrowth(hero.deltaPct)}
                <span className="ml-1 font-normal text-muted-foreground">t.o.v. {hero.prevLabel}</span>
              </span>
            )}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {hero.kpis.map((k) => (
              <div key={k.key} className="border-t border-border pt-3" data-testid="hero-kpi">
                <div className="text-[12px] text-muted-foreground">{k.label}</div>
                <div className="text-[22px] font-bold whitespace-nowrap text-foreground">{k.value}</div>
                {k.hint && <div className="mt-1 text-[12px] text-muted-foreground">{k.hint}</div>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <CaveatFootnote />
    </div>
  );
}
