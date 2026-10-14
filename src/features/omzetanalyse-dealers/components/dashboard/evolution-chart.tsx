"use client";

import { useId } from "react";
import { formatBedragKort } from "@/lib/format";
import { formatInteger } from "../../lib/omzetanalyse-format";
import { chronological, formatPct, productieAandeel } from "../../lib/dashboard-aggregations";
import type { DashJaar, DashboardModel, OmzetType, YearValues } from "../../lib/dashboard-types";
import { DashboardSection } from "./dashboard-section";
import { SectionNotice } from "./section-notice";
import { useTips } from "./dashboard-tips";

/** Shared stacked column chart (los bottom, productie top). Inputs newest-first. */
export function StackedColumns({
  jaren,
  values,
  focusIdx,
  type,
  onSelect,
  compact = false,
  ariaLabel,
}: {
  jaren: DashJaar[];
  values: YearValues[];
  focusIdx: number;
  type: OmzetType;
  onSelect?: (idx: number) => void;
  compact?: boolean;
  ariaLabel: string;
}) {
  const width = compact ? 380 : 760;
  const height = compact ? 150 : 300;
  const left = compact ? 42 : 58;
  const top = 24;
  const bottom = compact ? 26 : 40;
  const plotW = width - left - 8;
  const plotH = height - top - bottom;
  const cols = chronological(jaren.map((j, idx) => ({ j, idx, v: values[idx] })));
  const seg = (v: YearValues | undefined) => ({
    los: type === "productie" ? 0 : (v?.los ?? 0),
    productie: type === "los" ? 0 : (v?.productie ?? 0),
  });
  const max = Math.max(1, ...cols.map((c) => seg(c.v).los + seg(c.v).productie));
  const slot = plotW / cols.length;
  const barW = Math.min(slot * 0.6, 72);
  const y = (val: number) => top + plotH - (val / max) * plotH;
  const ticks = compact ? [max, 0] : [max, (max * 3) / 4, max / 2, max / 4, 0];
  const fs = compact ? 11 : 13;
  const pat = useId();
  const tips = useTips();

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={ariaLabel}>
      <defs>
        <pattern
          id={pat}
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="6" stroke="var(--card)" strokeWidth="2.2" opacity="0.55" />
        </pattern>
      </defs>
      {ticks.map((t, i) => (
        <g key={i}>
          <line
            x1={left}
            x2={width - 8}
            y1={y(t)}
            y2={y(t)}
            stroke="var(--border)"
            strokeDasharray={i === ticks.length - 1 ? undefined : "3 5"}
          />
          <text x={left - 6} y={y(t) + 4} textAnchor="end" fontSize={fs} className="fill-muted-foreground">
            {formatBedragKort(t)}
          </text>
        </g>
      ))}
      {cols.map((c, i) => {
        const s = seg(c.v);
        const tot = s.los + s.productie;
        const cx = left + slot * i + slot / 2;
        const focused = c.idx === focusIdx;
        const opacity = focused ? 1 : 0.5;
        const yLos = y(s.los);
        const yTop = y(tot);
        const share = productieAandeel(c.v ?? { los: 0, productie: 0, totaal: 0, orders: 0 });
        return (
          <g
            key={c.j.key}
            data-testid="evolution-column"
            data-focused={focused}
            role={onSelect ? "button" : undefined}
            tabIndex={onSelect ? 0 : undefined}
            aria-label={`${c.j.label}: ${formatBedragKort(tot)}`}
            aria-pressed={onSelect ? focused : undefined}
            onClick={onSelect ? () => onSelect(c.idx) : undefined}
            onKeyDown={
              onSelect
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(c.idx);
                    }
                  }
                : undefined
            }
            onPointerEnter={(e) => {
              if (e.pointerType === "touch") return;
              const lines = [
                `${c.j.label}${c.j.isYtd ? " (lopend jaar)" : ""}`,
                `Los: \u20AC\u00A0${formatInteger(s.los)}`,
                `Productie: \u20AC\u00A0${formatInteger(s.productie)}`,
                `Totaal: \u20AC\u00A0${formatInteger(tot)}`,
              ];
              if (share !== null) lines.push(`Productie-aandeel: ${formatPct(share)}`);
              tips.show(lines, e.clientX, e.clientY);
            }}
            onPointerMove={(e) => {
              if (e.pointerType === "touch") return;
              tips.move(e.clientX, e.clientY);
            }}
            onPointerLeave={tips.hide}
            onFocus={(e) => {
              const r = (e.target as SVGGElement).getBoundingClientRect();
              tips.show(
                [`${c.j.label}${c.j.isYtd ? " (lopend jaar)" : ""}`, `Totaal: \u20AC\u00A0${formatInteger(tot)}`],
                r.left + r.width / 2,
                r.top
              );
            }}
            onBlur={tips.hide}
            className={onSelect ? "cursor-pointer outline-none focus-visible:opacity-100" : undefined}
            style={focused ? { filter: "drop-shadow(0 0 8px var(--primary))" } : undefined}
          >
            <rect x={cx - slot / 2} y={0} width={slot} height={height} fill="transparent" />
            {s.los > 0 && (
              <rect x={cx - barW / 2} y={yLos} width={barW} height={plotH + top - yLos} fill="var(--chart-2)" opacity={opacity} />
            )}
            {s.productie > 0 && (
              <rect x={cx - barW / 2} y={yTop} width={barW} height={yLos - yTop} fill="var(--chart-1)" opacity={opacity} />
            )}
            {c.j.isYtd && tot > 0 && (
              <rect x={cx - barW / 2} y={yTop} width={barW} height={plotH + top - yTop} fill={`url(#${pat})`} />
            )}
            <text
              x={cx}
              y={Math.max(12, yTop - 7)}
              textAnchor="middle"
              fontSize={fs}
              fontWeight={focused ? 700 : 400}
              className={focused ? "fill-foreground" : "fill-muted-foreground"}
            >
              {tot > 0 ? formatBedragKort(tot) : "\u2013"}
            </text>
            <text
              x={cx}
              y={height - (c.j.isYtd && !compact ? 22 : compact ? 8 : 8)}
              textAnchor="middle"
              fontSize={fs}
              fontWeight={focused ? 700 : 400}
              className={focused ? "fill-foreground" : "fill-muted-foreground"}
            >
              {c.j.label}
            </text>
            {c.j.isYtd && (
              <text x={cx} y={height - 8} textAnchor="middle" fontSize={fs - 2} className="fill-muted-foreground">
                lopend
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function EvolutionChart({
  model,
  focusIdx,
  type,
  onFocusChange,
}: {
  model: DashboardModel;
  focusIdx: number;
  type: OmzetType;
  onFocusChange: (idx: number) => void;
}) {
  return (
    <DashboardSection
      title="Zo evolueert de omzet"
      note={
        model.modus === "JAREN" ? (
          <span className="flex flex-wrap gap-4">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block size-2.5" style={{ background: "var(--chart-1)" }} /> Productie
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block size-2.5" style={{ background: "var(--chart-2)" }} /> Los
            </span>
            <span>Klik op een jaar om er de rest van het dashboard op af te stemmen.</span>
          </span>
        ) : undefined
      }
    >
      {model.modus === "PERIODE" ? (
        <SectionNotice>
          Niet beschikbaar bij een periodefilter. Verwijder datum van/tot voor de jaarvergelijking.
        </SectionNotice>
      ) : (
        <StackedColumns
          jaren={model.jaren}
          values={model.totaal}
          focusIdx={focusIdx}
          type={type}
          onSelect={onFocusChange}
          ariaLabel="Omzetevolutie per jaar, los en productie"
        />
      )}
    </DashboardSection>
  );
}
