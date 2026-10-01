import { cn } from "@/lib/utils";
import { formatGrowth } from "../lib/omzetanalyse-format";

/** Small growth text under a value; renders nothing for null growth. */
export function GrowthBadge({ value }: { value: number | null }) {
  if (value === null || value === undefined) return null;
  return (
    <div
      data-testid="growth-badge"
      className={cn("text-[11px]", value < 0 ? "text-destructive" : "text-success-fg")}
    >
      {formatGrowth(value)}
    </div>
  );
}
