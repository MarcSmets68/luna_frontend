import { cn } from "@/lib/utils";
import { PlanningRow } from "./planning-row";
import type { PlanningDayGroup as PlanningDayGroupType } from "../types";

/** Section header (label + count) and its rows. */
export function PlanningDayGroup({ group }: { group: PlanningDayGroupType }) {
  const overdue = group.tone === "overdue";

  return (
    <section className="flex flex-col gap-3" aria-label={group.label}>
      <div className="flex items-center gap-2">
        <h2
          className={cn(
            "text-sm font-semibold",
            overdue ? "rounded-full bg-warning-bg px-3 py-1 text-warning-fg" : "text-foreground"
          )}
        >
          {group.label}
        </h2>
        <span className="text-xs text-muted-foreground">({group.items.length})</span>
      </div>
      <div className="flex flex-col gap-3">
        {group.items.map((item) => (
          <PlanningRow key={`${item.bonnr}-${item.lijnnr}`} item={item} showDate={overdue} />
        ))}
      </div>
    </section>
  );
}
