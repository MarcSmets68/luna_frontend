import { cn } from "@/lib/utils";
import { chronological } from "../../lib/dashboard-aggregations";
import type { DashboardModel, OmzetType } from "../../lib/dashboard-types";
import { SegmentedControl } from "./segmented-control";

const TYPE_OPTIONS: { value: OmzetType; label: string }[] = [
  { value: "totaal", label: "Totaal" },
  { value: "los", label: "Los" },
  { value: "productie", label: "Productie" },
];

export function DashboardToolbar({
  model,
  focusIdx,
  onFocusChange,
  type,
  onTypeChange,
}: {
  model: DashboardModel;
  focusIdx: number;
  onFocusChange: (idx: number) => void;
  type: OmzetType;
  onTypeChange: (t: OmzetType) => void;
}) {
  const chips = chronological(model.jaren.map((j, idx) => ({ ...j, idx })));
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {model.modus === "PERIODE" ? (
        <div className="text-sm text-foreground">
          <span className="text-muted-foreground">Periode: </span>
          <span className="font-semibold">{model.jaren[0]?.label}</span>
        </div>
      ) : (
        <div role="group" aria-label="Focusjaar" className="flex flex-wrap items-center gap-1.5">
          {chips.map((c) => (
            <button
              key={c.key}
              type="button"
              aria-pressed={c.idx === focusIdx}
              onClick={() => onFocusChange(c.idx)}
              className={cn(
                "border px-3 py-1 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                c.idx === focusIdx
                  ? "border-primary bg-primary font-semibold text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              {c.label}
              {c.isYtd && (
                <span className="ml-1.5 text-[10px] font-semibold tracking-[0.05em] uppercase">YTD</span>
              )}
            </button>
          ))}
        </div>
      )}
      <SegmentedControl label="Omzettype" options={TYPE_OPTIONS} value={type} onChange={onTypeChange} />
    </div>
  );
}
