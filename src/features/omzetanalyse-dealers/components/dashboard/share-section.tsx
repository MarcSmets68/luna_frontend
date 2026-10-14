"use client";

import { useMemo } from "react";
import {
  formatPct,
  productieAandeel,
  shareSeries,
  topProductieDealers,
} from "../../lib/dashboard-aggregations";
import type { DashboardModel } from "../../lib/dashboard-types";
import { formatInteger } from "../../lib/omzetanalyse-format";
import { BarRow } from "./bar-row";
import { DashboardSection } from "./dashboard-section";
import { perDealerNoticeText, SectionNotice } from "./section-notice";

function Donut({ share, label }: { share: number | null; label: string }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const filled = (share ?? 0) * c;
  return (
    <svg viewBox="0 0 140 140" className="h-auto w-40" role="img" aria-label={label}>
      <circle cx={70} cy={70} r={r} fill="none" stroke="var(--chart-2)" strokeWidth={18} />
      <circle
        cx={70}
        cy={70}
        r={r}
        fill="none"
        stroke="var(--chart-1)"
        strokeWidth={18}
        strokeDasharray={`${filled} ${c - filled}`}
        transform="rotate(-90 70 70)"
        style={{ filter: "drop-shadow(0 0 6px var(--primary))" }}
      />
      <text x={70} y={70} textAnchor="middle" fontSize={22} fontWeight={700} className="fill-foreground">
        {formatPct(share)}
      </text>
      <text x={70} y={88} textAnchor="middle" fontSize={10} className="fill-muted-foreground">
        productie
      </text>
    </svg>
  );
}

function ShareLine({ points, focusLabel }: { points: { label: string; share: number | null }[]; focusLabel: string }) {
  const w = 320;
  const h = 120;
  const l = 34;
  const vals = points.map((p) => p.share ?? 0);
  const max = Math.max(0.01, ...vals);
  const x = (i: number) => l + (points.length === 1 ? 0 : (i / (points.length - 1)) * (w - l - 12));
  const y = (v: number) => 10 + (1 - v / max) * (h - 38);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full" role="img" aria-label="Productie-aandeel per jaar">
      <line x1={l} x2={w - 8} y1={y(0)} y2={y(0)} stroke="var(--border)" />
      <line x1={l} x2={w - 8} y1={y(max)} y2={y(max)} stroke="var(--border)" strokeDasharray="3 5" />
      <text x={l - 4} y={y(max) + 4} textAnchor="end" fontSize={10} className="fill-muted-foreground">
        {formatPct(max)}
      </text>
      <polyline fill="none" stroke="var(--chart-1)" strokeWidth={2} points={vals.map((v, i) => `${x(i)},${y(v)}`).join(" ")} />
      {points.map((p, i) => (
        <g key={p.label}>
          {p.share !== null && (
            <circle
              cx={x(i)}
              cy={y(p.share)}
              r={p.label === focusLabel ? 5 : 3.5}
              fill="var(--chart-1)"
              style={p.label === focusLabel ? { filter: "drop-shadow(0 0 5px var(--primary))" } : undefined}
            />
          )}
          <text
            x={x(i)}
            y={p.share !== null ? y(p.share) - 10 : h - 22}
            textAnchor="middle"
            fontSize={10}
            fontWeight={p.label === focusLabel ? 700 : 400}
            className={p.label === focusLabel ? "fill-foreground" : "fill-muted-foreground"}
          >
            {p.share !== null ? formatPct(p.share) : ""}
          </text>
          <text x={x(i)} y={h - 6} textAnchor="middle" fontSize={10} className={p.label === focusLabel ? "fill-foreground font-semibold" : "fill-muted-foreground"}>
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function ShareSection({
  model,
  focusIdx,
  onSelect,
}: {
  model: DashboardModel;
  focusIdx: number;
  onSelect: (klnr: number) => void;
}) {
  const cur = model.totaal[focusIdx];
  const share = cur ? productieAandeel(cur) : null;
  const series = useMemo(() => shareSeries(model), [model]);
  const top = useMemo(() => topProductieDealers(model.dealers, focusIdx, 6), [model.dealers, focusIdx]);
  const focusLabel = model.jaren[focusIdx]?.label ?? "";
  const maxProd = Math.max(1, ...top.map((t) => t.productie));
  return (
    <DashboardSection title="Los of productie" note="Hoeveel van de omzet komt uit productie, het werk dat op maat gemaakt wordt?">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex items-center gap-4">
          <Donut share={share} label={`Productie-aandeel in ${focusLabel}: ${formatPct(share)}`} />
          <ul className="space-y-1 text-[13px]">
            <li className="flex items-center gap-2">
              <span className="inline-block size-2.5" style={{ background: "var(--chart-1)" }} />
              Productie: {"\u20AC\u00A0"}
              {formatInteger(cur?.productie ?? 0)}
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-block size-2.5" style={{ background: "var(--chart-2)" }} />
              Los: {"\u20AC\u00A0"}
              {formatInteger(cur?.los ?? 0)}
            </li>
          </ul>
        </div>
        {model.modus === "JAREN" && (
          <div>
            <h4 className="mb-2 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
              Productie-aandeel per jaar
            </h4>
            <ShareLine points={series} focusLabel={focusLabel} />
          </div>
        )}
      </div>
      <div className="mt-6">
        <h4 className="mb-2 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          Grootste productie in {focusLabel}
        </h4>
        {!model.perDealer ? (
          <SectionNotice>{perDealerNoticeText()}</SectionNotice>
        ) : top.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">Geen productieomzet in {focusLabel}.</p>
        ) : (
          <ul className="-mx-1">
            {top.map((t) => (
              <li key={t.klnr} data-testid="top-productie-row">
                <BarRow
                  name={t.naam}
                  value={t.productie}
                  max={maxProd}
                  color="var(--chart-1)"
                  sub={
                    <>
                      {"\u20AC\u00A0"}
                      {formatInteger(t.productie)}
                      <span className="block text-[11px]">{formatPct(t.share)} van eigen omzet</span>
                    </>
                  }
                  onClick={() => onSelect(t.klnr)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardSection>
  );
}
