import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { recentActivity } from "../data/mock";

export function RecentActivityCard() {
  return (
    <Card className="rounded-none border-border shadow-none">
      <CardHeader className="border-b border-border py-3.5">
        <CardTitle className="text-sm font-semibold text-foreground">Recente activiteit</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {recentActivity.map((item, i) => (
          <div
            key={item.text}
            className={
              "flex justify-between px-5 py-3 text-[13px] " +
              (i < recentActivity.length - 1 ? "border-b border-muted" : "")
            }
          >
            <span className="text-[#444444]">{item.text}</span>
            <span className="ml-3 shrink-0 text-muted-foreground">{item.time}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
