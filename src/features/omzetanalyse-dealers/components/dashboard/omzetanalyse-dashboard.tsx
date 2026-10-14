"use client";

import { useMemo, useState } from "react";
import { computeHero, resolveFocusIndex, selectDealers } from "../../lib/dashboard-aggregations";
import type { DashboardModel, OmzetType } from "../../lib/dashboard-types";
import { formatInteger } from "../../lib/omzetanalyse-format";
import { useDashboardUrlState } from "../../lib/use-dashboard-url-state";
import { DashboardTips } from "./dashboard-tips";
import { DashboardToolbar } from "./dashboard-toolbar";
import { DealerDrawer } from "./dealer-drawer";
import { DealersTable } from "./dealers-table";
import { EvolutionChart } from "./evolution-chart";
import { HeroKpis } from "./hero-kpis";
import { MixSection } from "./mix-section";
import { Movers } from "./movers";
import { ShareSection } from "./share-section";

export function OmzetanalyseDashboard({
  model,
  initialFocus,
}: {
  model: DashboardModel;
  initialFocus?: string | null;
}) {
  const { setFocus } = useDashboardUrlState({ focus: initialFocus });
  const [focusIdx, setFocusIdx] = useState(() => resolveFocusIndex(model, initialFocus));
  const [type, setType] = useState<OmzetType>("totaal");
  const [dealerSelection, setDealerSelection] = useState<ReadonlySet<number>>(new Set());
  const [drawerKlnr, setDrawerKlnr] = useState<number | null>(null);

  // The filtered view drives every section; the pickers keep the full model.
  const view = useMemo(() => selectDealers(model, dealerSelection), [model, dealerSelection]);
  const hero = useMemo(() => computeHero(view, focusIdx, type), [view, focusIdx, type]);
  const who = useMemo(() => {
    const total = model.dealers.length;
    if (dealerSelection.size === 0) return `alle ${formatInteger(total)} dealers`;
    if (dealerSelection.size === 1) {
      const klnr = [...dealerSelection][0];
      return model.dealers.find((d) => d.klnr === klnr)?.naam ?? "1 dealer";
    }
    return `${formatInteger(dealerSelection.size)} van ${formatInteger(total)} dealers`;
  }, [model.dealers, dealerSelection]);

  const changeFocus = (idx: number) => {
    setFocusIdx(idx);
    const key = model.jaren[idx]?.key;
    if (key && model.modus === "JAREN") setFocus(key);
  };
  const focus = model.jaren[focusIdx];

  return (
    <DashboardTips>
      <div className="space-y-4">
        <DashboardToolbar
          model={model}
          focusIdx={focusIdx}
          onFocusChange={changeFocus}
          type={type}
          onTypeChange={setType}
          dealerSelection={dealerSelection}
          onDealerSelection={setDealerSelection}
        />
        <HeroKpis
          model={view}
          hero={hero}
          type={type}
          focusLabel={focus?.label ?? ""}
          isYtd={!!focus?.isYtd}
          who={who}
        />
        <EvolutionChart model={view} focusIdx={focusIdx} type={type} onFocusChange={changeFocus} />
        <DealersTable model={view} focusIdx={focusIdx} type={type} onSelect={setDrawerKlnr} />
        <Movers model={view} focusIdx={focusIdx} type={type} onSelect={setDrawerKlnr} />
        <ShareSection model={view} focusIdx={focusIdx} onSelect={setDrawerKlnr} />
        <MixSection model={view} focusIdx={focusIdx} onSelect={setDrawerKlnr} />
        <DealerDrawer
          model={view}
          klnr={drawerKlnr}
          focusIdx={focusIdx}
          type={type}
          onClose={() => setDrawerKlnr(null)}
          onFocusChange={changeFocus}
        />
      </div>
    </DashboardTips>
  );
}
