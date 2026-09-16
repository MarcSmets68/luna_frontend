import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardOmzetTrendItem } from "@/lib/api-client";

export function OmzetTrendCard({ items }: { items: DashboardOmzetTrendItem[] }) {
  const width = 600;
  const height = 140;
  const plotTop = 12;
  const plotBottom = 115;
  const n = items.length;

  const values = items.map((d) => d.total);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const x = (i: number) => (i / (n - 1)) * width;
  const y = (value: number) =>
    plotBottom - ((value - min) / range) * (plotBottom - plotTop);

  return (
    <Card className="rounded-none border-border shadow-none">
      <CardHeader className="border-b border-border py-3.5">
        <CardTitle className="text-sm font-semibold text-foreground">
          Omzet 6 maanden
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 py-4">
        <div className="text-[12px] text-muted-foreground">
          tot nu toe {items[items.length - 1]?.label ?? ""}
        </div>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="mt-3 h-auto w-full"
          role="img"
          aria-label="Omzet trend afgelopen 6 maanden"
        >
          {items.map((item, i) => (
            <text
              key={`label-${item.year}-${item.month}`}
              x={x(i)}
              y={height - 6}
              textAnchor="middle"
              className="fill-muted-foreground text-[10px]"
            >
              {item.label}
            </text>
          ))}

          <polyline
            fill="none"
            stroke="#60a172"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={items
              .slice(0, 5)
              .map((item, i) => `${x(i)},${y(item.total)}`)
              .join(" ")}
          />

          {n >= 2 && (
            <line
              x1={x(n - 2)}
              y1={y(items[n - 2].total)}
              x2={x(n - 1)}
              y2={y(items[n - 1].total)}
              stroke="#60a172"
              strokeWidth="2"
              strokeDasharray="4 2"
            />
          )}

          {items.map((item, i) => {
            const isLast = i === n - 1;
            return (
              <circle
                key={`dot-${item.year}-${item.month}`}
                cx={x(i)}
                cy={y(item.total)}
                r={isLast ? 5 : 4}
                fill={isLast ? "white" : "#60a172"}
                stroke="#60a172"
                strokeWidth="2"
              />
            );
          })}
        </svg>
      </CardContent>
    </Card>
  );
}
