import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { productionThisWeek, stageStyles } from "../data/mock";

export function ProductionCard() {
  return (
    <Card className="rounded-none border-border shadow-none">
      <CardHeader className="border-b border-border py-3.5">
        <CardTitle className="text-sm font-semibold text-foreground">Productie deze week</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {productionThisWeek.map((order, i) => (
          <div
            key={order.id}
            className={
              "px-5 py-2.75 " + (i < productionThisWeek.length - 1 ? "border-b border-muted" : "")
            }
          >
            <div className="flex justify-between text-[12.5px] font-semibold text-foreground">
              <span>{order.id}</span>
              <span className="font-normal text-muted-foreground">{order.due}</span>
            </div>
            <div className="mt-0.5 text-[12px] text-[#5e5e5e]">{order.customer}</div>
            <Badge
              className={`mt-1.5 rounded-none border-none px-1.75 py-0.5 text-[10.5px] font-bold tracking-[0.03em] ${stageStyles[order.stage]}`}
            >
              {order.stage}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
