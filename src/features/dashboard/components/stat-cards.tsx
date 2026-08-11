import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { statCards } from "../data/mock";

const hintColorClass: Record<NonNullable<(typeof statCards)[number]["hintColor"]>, string> = {
  default: "text-[#5e5e5e]",
  positive: "text-primary",
  warning: "text-[#8a6820]",
};

export function StatCards() {
  return (
    <div className="mb-7 grid grid-cols-4 gap-4">
      {statCards.map((stat) => (
        <Card key={stat.label} className="rounded-none border-border shadow-none">
          <CardContent className="px-5 py-1">
            <div className="mb-2 text-[11px] font-semibold tracking-[0.05em] text-[#787878] uppercase">
              {stat.label}
            </div>
            <div
              className={cn(
                "text-[22px] font-bold whitespace-nowrap",
                stat.hintColor === "warning" ? "text-[#8a6820]" : "text-foreground"
              )}
            >
              {stat.value}
            </div>
            <div className={cn("mt-1 text-[12px]", hintColorClass[stat.hintColor ?? "default"])}>
              {stat.hint}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
