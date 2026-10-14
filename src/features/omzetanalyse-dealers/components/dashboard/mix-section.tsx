"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  artikelRows,
  groepDealerBreakdown,
  mixAvailableUnits,
  mixRows,
} from "../../lib/dashboard-aggregations";
import type { DashboardModel, QtyUnit } from "../../lib/dashboard-types";
import { formatInteger, formatQty } from "../../lib/omzetanalyse-format";
import { DashboardSection } from "./dashboard-section";
import { SectionNotice } from "./section-notice";
import { SegmentedControl } from "./segmented-control";
import { Sparkline } from "./sparkline";

const DEFAULT_ROWS = 10;
type View = "groep" | "artikel";

function QtyBar({ los, productie, max }: { los: number; productie: number; max: number }) {
  return (
    <div className="flex h-2 w-full bg-muted" aria-hidden="true">
      <div style={{ width: `${(los / max) * 100}%`, background: "var(--chart-2)" }} />
      <div style={{ width: `${(productie / max) * 100}%`, background: "var(--chart-1)" }} />
    </div>
  );
}

export function MixSection({ model, focusIdx }: { model: DashboardModel; focusIdx: number }) {
  const units = useMemo(() => mixAvailableUnits(model), [model]);
  const [unitState, setUnit] = useState<QtyUnit>("m");
  const unit: QtyUnit = units.includes(unitState) ? unitState : (units[0] ?? "m");
  const [view, setView] = useState<View>("groep");
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const rows = useMemo(() => mixRows(model, unit, focusIdx, { query }), [model, unit, focusIdx, query]);
  const arts = useMemo(
    () => (view === "artikel" ? artikelRows(model, unit, focusIdx, { query }) : []),
    [model, unit, focusIdx, query, view]
  );
  const breakdown = useMemo(
    () =>
      expanded && model.perDealer ? groepDealerBreakdown(model, expanded, unit, focusIdx) : null,
    [model, expanded, unit, focusIdx]
  );

  const list = view === "groep" ? rows : arts;
  const shown = showAll ? list : list.slice(0, DEFAULT_ROWS);
  const max = Math.max(1, ...list.map((r) => r.los + r.productie));
  const anyPrefix = view === "artikel" && arts.some((a) => a.swBegins);

  return (
    <DashboardSection
      title="Hoeveelheid (LED / niet-LED)"
      actions={
        <div className="flex flex-wrap items-center gap-3">
          <SegmentedControl<View>
            label="Weergave"
            value={view}
            onChange={(v) => {
              setView(v);
              setShowAll(false);
            }}
            options={[
              { value: "groep", label: "Productgroep" },
              { value: "artikel", label: "Artikel" },
            ]}
          />
          {units.length > 0 && (
            <SegmentedControl<QtyUnit>
              label="Eenheid"
              value={unit}
              onChange={setUnit}
              options={units.map((u) => ({ value: u, label: u === "m" ? "meter" : "stuks" }))}
            />
          )}
        </div>
      }
      note={
        <span>
          Hoeveelheden volgen de LED/niet-LED-indeling en zijn niet gelijk aan het omzetaandeel los/productie.
          Meters en stuks worden nooit opgeteld.
        </span>
      }
    >
      {units.length === 0 ? (
        <SectionNotice>Geen hoeveelheden beschikbaar voor deze selectie.</SectionNotice>
      ) : (
        <>
          <Input
            type="search"
            aria-label="Zoek productgroep of artikel"
            placeholder="Zoek..."
            className="mb-3 max-w-64 rounded-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {anyPrefix && (
            <p className="mb-2 text-[12px] text-muted-foreground">
              Artikelomschrijvingen zijn niet beschikbaar in dit rapport; artikelnummers die eindigen op &hellip; zijn prefixen.
            </p>
          )}
          <ul className="divide-y divide-border">
            {view === "groep"
              ? rows.slice(0, showAll ? rows.length : DEFAULT_ROWS).map((r) => (
                  <li key={r.categorie} data-testid="mix-row" className="py-2 text-[13px]">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        aria-expanded={expanded === r.categorie}
                        disabled={!model.perDealer}
                        onClick={() => setExpanded(expanded === r.categorie ? null : r.categorie)}
                        className="w-40 truncate text-left font-medium text-foreground outline-none enabled:hover:underline"
                      >
                        {r.categorie}
                      </button>
                      <div className="flex-1">
                        <QtyBar los={r.los} productie={r.productie} max={max} />
                      </div>
                      <span className="w-24 text-right">
                        {formatQty(r.total)} {unit}
                      </span>
                      <Sparkline values={r.spark} width={64} />
                      <span className="w-20 text-right text-muted-foreground">{formatInteger(r.orders)} orders</span>
                      {r.dealersMetQty !== null && (
                        <span className="w-24 text-right text-muted-foreground">
                          {formatInteger(r.dealersMetQty)} dealers
                        </span>
                      )}
                    </div>
                    {expanded === r.categorie && breakdown && (
                      <ul className="mt-2 ml-4 space-y-0.5 text-[12px] text-muted-foreground">
                        {breakdown.shown.map((b) => (
                          <li key={b.klnr} className="flex justify-between">
                            <span>{b.naam}</span>
                            <span>
                              {formatQty(b.los + b.productie)} {unit}
                            </span>
                          </li>
                        ))}
                        {breakdown.rest > 0 && <li>en nog {breakdown.rest}</li>}
                        {breakdown.shown.length === 0 && <li>Geen dealers met hoeveelheid.</li>}
                      </ul>
                    )}
                  </li>
                ))
              : arts.slice(0, showAll ? arts.length : DEFAULT_ROWS).map((a) => (
                  <li
                    key={`${a.categorie}-${a.artnr}`}
                    data-testid="mix-row"
                    className="flex items-center gap-3 py-2 text-[13px]"
                  >
                    <span className="w-40 truncate font-medium text-foreground" title={a.categorie}>
                      {a.artnr}
                      {a.swBegins ? "\u2026" : ""}
                    </span>
                    <div className="flex-1">
                      <QtyBar los={a.los} productie={a.productie} max={max} />
                    </div>
                    <span className="w-24 text-right">
                      {formatQty(a.los + a.productie)} {unit}
                    </span>
                    <Sparkline values={a.spark} width={64} />
                  </li>
                ))}
          </ul>
          {list.length === 0 && <p className="py-2 text-[13px] text-muted-foreground">Geen resultaten.</p>}
          {!showAll && shown.length < list.length && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="mt-3 text-[13px] font-semibold text-primary-600 hover:underline"
            >
              Toon alle {formatInteger(list.length)}
            </button>
          )}
        </>
      )}
    </DashboardSection>
  );
}
