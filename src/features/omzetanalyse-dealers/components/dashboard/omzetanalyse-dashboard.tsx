"use client";

import { useMemo, useState } from "react";
import { computeHero, resolveFocusIndex } from "../../lib/dashboard-aggregations";
import type { DashboardModel, OmzetType } from "../../lib/dashboard-types";
import { useDashboardUrlState } from "../../lib/use-dashboard-url-state";
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
  const [selected, setSelected] = useState<number | null>(null);

  const hero = useMemo(() => computeHero(model, focusIdx, type), [model, focusIdx, type]);
  const changeFocus = (idx: number) => {
    setFocusIdx(idx);
    const key = model.jaren[idx]?.key;
    if (key && model.modus === "JAREN") setFocus(key);
  };
  const focus = model.jaren[focusIdx];

  return (
    <div className="space-y-4">
      <DashboardToolbar
        model={model}
        focusIdx={focusIdx}
        onFocusChange={changeFocus}
        type={type}
        onTypeChange={setType}
      />
      <HeroKpis hero={hero} type={type} focusLabel={focus?.label ?? ""} isYtd={!!focus?.isYtd} />
      <EvolutionChart model={model} focusIdx={focusIdx} type={type} onFocusChange={changeFocus} />
      <DealersTable model={model} focusIdx={focusIdx} type={type} onSelect={setSelected} />
      <Movers model={model} focusIdx={focusIdx} type={type} />
      <ShareSection model={model} focusIdx={focusIdx} />
      <MixSection model={model} focusIdx={focusIdx} />
      <DealerDrawer
        model={model}
        klnr={selected}
        focusIdx={focusIdx}
        type={type}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
