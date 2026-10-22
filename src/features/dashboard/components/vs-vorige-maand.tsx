import { cn } from "@/lib/utils";

/** Small "vs vorige maand" indicator; null means no usable previous-month figure. */
export function VsVorigeMaand({ value }: { value: number | null }) {
  if (value === null || value === undefined) {
    return (
      <div data-testid="vs-vorige-maand" className="text-[11px] text-muted-foreground">
        geen data vorige maand
      </div>
    );
  }
  const negative = value < 0;
  return (
    <div
      data-testid="vs-vorige-maand"
      className={cn("text-[11px]", negative ? "text-destructive" : "text-success-fg")}
    >
      {negative ? "↓" : "↑"} {Math.abs(value).toLocaleString("nl-BE", { maximumFractionDigits: 1 })}% vs vorige maand
    </div>
  );
}
