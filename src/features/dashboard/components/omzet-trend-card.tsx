import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardOmzetTrendItem } from "@/lib/api-client";

export function OmzetTrendCard({ items }: { items: DashboardOmzetTrendItem[] }) {
  const width = 300;
  const height = 70;
  const plotTop = 6;
  const plotBottom = 57.5;
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
          Omzet 12 maanden
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 py-4">
        <div className="text-[12px] text-muted-foreground">
          tot nu toe {items[items.length - 1]?.label ?? ""}
        </div>
        <div className="mt-3 max-w-[300px]">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-auto w-full"
            role="img"
            aria-label="Omzet trend afgelopen 12 maanden"
          >
            {items.map((item, i) => (
              <text
                key={`label-${item.year}-${item.month}`}
                x={x(i)}
                y={height - 3}
                textAnchor="middle"
                className="fill-muted-foreground text-[6px]"
              >
                {item.label}
              </text>
            ))}

            <polyline
              fill="none"
              stroke="#60a172"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={items
                .slice(0, Math.max(n - 1, 0))
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
                strokeWidth="1"
                strokeDasharray="2 1"
              />
            )}

            {items.map((item, i) => {
              const isLast = i === n - 1;
              return (
                <circle
                  key={`dot-${item.year}-${item.month}`}
                  cx={x(i)}
                  cy={y(item.total)}
                  r={isLast ? 2.5 : 2}
                  fill={isLast ? "white" : "#60a172"}
                  stroke="#60a172"
                  strokeWidth="1"
                />
              );
            })}
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}
