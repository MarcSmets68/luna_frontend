import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Raw `stempel` codes on the `order` table that this UI knows how to label. */
const STEMPEL_LABELS: Record<string, string> = {
  O: "Open",
  V: "Aktief",
  B: "Backorder",
  D: "Gesloten",
};

const STEMPEL_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  O: "outline",
  V: "default",
  B: "secondary",
  D: "destructive",
};

/** Extra color classes layered on top of the base variant above, for
    codes that need a color the shared Badge variants don't cover
    (e.g. amber for "Backorder"). */
const STEMPEL_CLASSNAMES: Record<string, string> = {
  B: "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
};

/**
 * Status pill for a bestelorder's raw `stempel` code. Unrecognized/blank
 * codes fall back to showing the raw code itself in the neutral
 * ("outline") variant, so nothing silently disappears if the legacy data
 * contains a code not in the map above.
 */
export function BestellingStatusBadge({ stempel }: { stempel: string }) {
  const label = STEMPEL_LABELS[stempel] ?? (stempel || "\u2014");
  const variant = STEMPEL_VARIANTS[stempel] ?? "outline";

  return (
    <Badge
      variant={variant}
      className={cn("text-[10.5px] font-medium", STEMPEL_CLASSNAMES[stempel])}
    >
      {label}
    </Badge>
  );
}
