"use client";

import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  groepDealerBreakdown,
  mixAvailableUnits,
  mixRows,
  uitvoeringDealerBreakdown,
  uitvoeringRows,
} from "../../lib/dashboard-aggregations";
import type { DashboardModel, QtyUnit } from "../../lib/dashboard-types";
import { formatInteger, formatQty } from "../../lib/omzetanalyse-format";
import { BarRow } from "./bar-row";
import { DashboardSection } from "./dashboard-section";
import { SectionNotice } from "./section-notice";
import { SegmentedControl } from "./segmented-control";
import { Sparkline } from "./sparkline";

type MixMode = "groepen" | "uitvoeringen";

export function MixSection({
  model,
  focusIdx,
  onSelect,
}: {
  model: DashboardModel;
  focusIdx: number;
  onSelect: (klnr: number) => void;
}) {
  const [mode, setMode] = useState<MixMode>("groepen");
  const [unit, setUnit] = useState<QtyUnit>("m");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const focusLabel = model.jaren[focusIdx]?.label ?? "";
  const units = useMemo(() => mixAvailableUnits(model), [model]);
  const effUnit = units.length === 0 || units.includes(unit) ? unit : units[0];

  const rows = useMemo(() => {
    const opts = { query };
    if (mode === "uitvoeringen") {
      return uitvoeringRows(model, effUnit, focusIdx, opts).map((r) => ({
        key: r.label,
        name: r.label,
        prefix: r.prefix,
        qty: r.los + r.productie,
        spark: r.spark,
      }));
    }
    return mixRows(model, effUnit, focusIdx, opts).map((r) => ({
      key: r.categorie,
      name: r.categorie,
      prefix: false,
      qty: r.total,
      spark: r.spark,
    }));
  }, [model, mode, effUnit, focusIdx, query]);

  const max = Math.max(1, ...rows.map((r) => r.qty));
  const toggle = (k: string) => setOpen((o) => ({ ...o, [k]: !o[k] }));

  return (
    <DashboardSection title="Wat er verkoopt" note={`Hoeveelheden in ${focusLabel} - klapt open per dealer.`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl
          label="Productweergave"
          value={mode}
          onChange={setMode}
          options={[
            { value: "groepen", label: "Productgroepen" },
            { value: "uitvoeringen", label: "Uitvoeringen" },
          ]}
        />
        <div className="flex items-center gap-3">
          <Input
            type="search"
            aria-label="Zoek in mix"
            placeholder="Zoek een groep of uitvoering"
            className="w-64 rounded-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {units.length > 1 && (
            <SegmentedControl
              label="Eenheid"
              value={effUnit}
              onChange={setUnit}
              options={units.map((u) => ({ value: u, label: u === "m" ? "Meter" : "Stuks" }))}
            />
          )}
        </div>
      </div>
      {rows.length === 0 ? (
        <SectionNotice>
          {model.groepen.length === 0 && model.artikelen.length === 0
            ? "Geen productdetail in deze respons."
            : `Geen ${mode === "groepen" ? "productgroepen" : "uitvoeringen"} in ${effUnit === "m" ? "meter" : "stuks"}${query.trim() ? " voor deze zoekterm" : ""}.`}
        </SectionNotice>
      ) : (
        <ul className="-mx-1 divide-y divide-border/50">
          {rows.map((r) => {
            const isOpen = open[r.key] ?? false;
            const breakdown = isOpen
              ? mode === "uitvoeringen"
                ? uitvoeringDealerBreakdown(model, r.key, effUnit, focusIdx)
                : groepDealerBreakdown(model, r.key, effUnit, focusIdx)
              : null;
            const shown =
              breakdown?.shown.map((d) => ({ ...d, qty: "qty" in d ? d.qty : d.los + d.productie })) ?? [];
            const maxD = Math.max(1, ...shown.map((d) => d.qty));
            return (
              <li key={r.key} data-testid="mix-row">
                <button
                  type="button"
                  onClick={() => toggle(r.key)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[1rem_minmax(0,1fr)] items-center gap-1 px-1 py-1.5 text-left hover:bg-muted/30 focus-visible:bg-muted/30"
                >
                  <ChevronRight
                    className={cn("size-3.5 text-muted-foreground transition-transform", isOpen && "rotate-90")}
                  />
                  <BarRow
                    name={
                      <span className="inline-flex items-center gap-2">
                        {r.name}
                        {r.prefix && <span className="text-[11px] text-muted-foreground">(artnr-prefix)</span>}
                        <Sparkline values={r.spark} />
                      </span>
                    }
                    value={r.qty}
                    max={max}
                    color="var(--chart-2)"
                    sub={
                      <>
                        {formatQty(r.qty)} {effUnit}
                      </>
                    }
                  />
                </button>
                {isOpen &&
                  (!model.perDealer ? (
                    <p className="py-1 pl-8 text-[13px] text-muted-foreground">
                      Dealer-uitsplitsing vraagt om een rapport per dealer.
                    </p>
                  ) : shown.length === 0 ? (
                    <p className="py-1 pl-8 text-[13px] text-muted-foreground">
                      Geen dealers met hoeveelheid in {focusLabel}.
                    </p>
                  ) : (
                    <ul className="pb-2 pl-8">
                      {shown.map((d) => (
                        <li key={d.klnr}>
                          <BarRow
                            name={d.naam}
                            value={d.qty}
                            max={maxD}
                            color="var(--chart-1)"
                            sub={
                              <>
                                {formatQty(d.qty)} {effUnit}
                              </>
                            }
                            onClick={() => onSelect(d.klnr)}
                          />
                        </li>
                      ))}
                      {(breakdown?.rest ?? 0) > 0 && (
                        <li className="px-1 py-1 text-[12px] text-muted-foreground">
                          + {formatInteger(breakdown!.rest)} dealer{breakdown!.rest === 1 ? "" : "s"} meer
                        </li>
                      )}
                    </ul>
                  ))}
              </li>
            );
          })}
        </ul>
      )}
    </DashboardSection>
  );
}
