"use client";

import { cn } from "@/lib/utils";
import { formatGrowth, formatInteger } from "../../lib/omzetanalyse-format";
import type { HeroData } from "../../lib/dashboard-aggregations";
import type { DashboardModel, OmzetType } from "../../lib/dashboard-types";
import { CaveatFootnote } from "./omzet-caveat";
import { useCountUp } from "./use-count-up";

const KIND_LABEL: Record<OmzetType, string> = {
  totaal: "los en productie",
  los: "los",
  productie: "productie",
};

/**
 * Big animated revenue figure + caption + delta + KPI strip
 * (hero block of the reference page, restyled to app colors).
 */
export function HeroKpis({
  model,
  hero,
  type,
  focusLabel,
  isYtd,
  who,
}: {
  model: DashboardModel;
  hero: HeroData;
  type: OmzetType;
  focusLabel: string;
  isYtd: boolean;
  /** e.g. "alle 42 dealers", "3 van 42 dealers" or the dealer name */
  who: string;
}) {
  const animated = useCountUp(hero.value);
  const prevIsYtd = model.modus === "JAREN" && model.jaren.some((j) => j.isYtd) && hero.mode === "jaren" && model.jaren.find((j) => j.label === hero.prevLabel)?.isYtd;
  return (
    <section aria-label="Samenvatting" className="relative">
      <p
        data-testid="hero-value"
        className="text-[clamp(2.6rem,7vw,5rem)] leading-none font-bold tracking-tight text-foreground tabular-nums"
      >
        {"\u20AC\u00A0"}
        {formatInteger(Math.round(animated))}
      </p>
      <p className="mt-3 text-[15px] text-foreground">
        Omzet {KIND_LABEL[type]} in {focusLabel}
        {isYtd ? " (lopend jaar, tot nu toe)" : ""}, {who}.
      </p>
      <p className="mt-1 text-[13px] text-muted-foreground" data-testid="hero-delta">
        {hero.mode === "periode" ? (
          <>Totaal over de gekozen periode.</>
        ) : hero.prevLabel === null ? (
          <>Dit is het oudste jaar in de analyse.</>
        ) : (
          <>
            {hero.deltaPct !== null ? (
              <span
                className={cn(
                  "font-semibold",
                  hero.deltaPct < 0 ? "text-destructive" : "text-success-fg"
                )}
              >
                {formatGrowth(hero.deltaPct)}
              </span>
            ) : (
              <span className="font-semibold text-muted-foreground">{"\u2014"}</span>
            )}{" "}
            t.o.v. {hero.prevLabel}
            {prevIsYtd ? " (lopend jaar)" : ""}
            {isYtd && !prevIsYtd ? (
              <>
                {" "}
                &middot; {focusLabel} loopt nog en {hero.prevLabel} is een volledig jaar &mdash;
                lees het verschil met die bril.
              </>
            ) : null}
          </>
        )}
      </p>
      <CaveatFootnote />
      <div className="mt-7 grid grid-cols-2 border-t border-border lg:grid-cols-4">
        {hero.kpis.map((k, i) => (
          <div
            key={k.key}
            data-testid="hero-kpi"
            className={cn("border-border px-0 py-3.5", i > 0 && "border-l pl-4", i === 2 && "max-lg:border-l-0 max-lg:border-t max-lg:pl-0", i === 3 && "max-lg:border-t")}
          >
            <div className="text-[22px] font-bold text-foreground tabular-nums">{k.value}</div>
            <div className="mt-0.5 text-[13px] text-foreground">{k.label}</div>
            {k.hint && <div className="mt-0.5 text-[12px] text-muted-foreground">{k.hint}</div>}
          </div>
        ))}
      </div>
    </section>
  );
}
