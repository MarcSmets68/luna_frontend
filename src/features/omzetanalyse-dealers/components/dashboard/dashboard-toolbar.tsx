"use client";

import { cn } from "@/lib/utils";
import { chronological } from "../../lib/dashboard-aggregations";
import type { DashboardModel, OmzetType } from "../../lib/dashboard-types";
import { DealerPicker } from "./dealer-picker";
import { SegmentedControl } from "./segmented-control";

const TYPE_OPTIONS: { value: OmzetType; label: string }[] = [
  { value: "totaal", label: "Beide" },
  { value: "los", label: "Los" },
  { value: "productie", label: "Productie" },
];

/**
 * Sticky filter bar (like the reference page): year segments, dealer
 * multi-select, omzet-type segmented control and a reset button.
 */
export function DashboardToolbar({
  model,
  focusIdx,
  onFocusChange,
  type,
  onTypeChange,
  dealerSelection,
  onDealerSelection,
}: {
  model: DashboardModel;
  focusIdx: number;
  onFocusChange: (idx: number) => void;
  type: OmzetType;
  onTypeChange: (t: OmzetType) => void;
  dealerSelection: ReadonlySet<number>;
  onDealerSelection: (next: Set<number>) => void;
}) {
  const chips = chronological(model.jaren.map((j, idx) => ({ ...j, idx })));
  const filtered = dealerSelection.size > 0 || type !== "totaal";
  return (
    <div className="sticky top-0 z-20 -mx-8 border-b border-border bg-background/85 px-8 py-2 backdrop-blur">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-muted-foreground">Jaar</span>
          {model.modus === "PERIODE" ? (
            <span className="text-[13px] font-semibold text-foreground">{model.jaren[0]?.label}</span>
          ) : (
            <div role="group" aria-label="Focusjaar" className="flex flex-wrap items-center gap-1">
              {chips.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  aria-pressed={c.idx === focusIdx}
                  title={c.isYtd ? "Lopend jaar" : undefined}
                  onClick={() => onFocusChange(c.idx)}
                  className={cn(
                    "border px-2.5 py-0.5 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                    c.idx === focusIdx
                      ? "border-primary bg-primary font-semibold text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  )}
                >
                  {c.label}
                  {c.isYtd && (
                    <span
                      aria-label="lopend jaar"
                      className="ml-1 inline-block size-1.5 rounded-full bg-current align-middle opacity-80"
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        {model.perDealer && (
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-muted-foreground">Dealers</span>
            <DealerPicker
              dealers={model.dealers}
              selected={dealerSelection}
              onChange={onDealerSelection}
            />
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-muted-foreground">Soort</span>
          <SegmentedControl
            label="Omzettype"
            options={TYPE_OPTIONS}
            value={type}
            onChange={onTypeChange}
          />
        </div>
        {filtered && (
          <button
            type="button"
            onClick={() => {
              onDealerSelection(new Set());
              onTypeChange("totaal");
            }}
            className="text-[13px] font-medium text-primary-600 hover:underline"
          >
            Wis filters
          </button>
        )}
      </div>
    </div>
  );
}
