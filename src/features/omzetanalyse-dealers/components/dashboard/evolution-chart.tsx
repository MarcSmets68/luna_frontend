import { formatBedragKort } from "@/lib/format";
import { chronological } from "../../lib/dashboard-aggregations";
import type { DashJaar, DashboardModel, OmzetType, YearValues } from "../../lib/dashboard-types";
import { DashboardSection } from "./dashboard-section";
import { SectionNotice } from "./section-notice";

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
  const width = compact ? 360 : 720;
  const height = compact ? 140 : 280;
  const left = compact ? 40 : 56;
  const top = 12;
  const bottom = compact ? 22 : 32;
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
  const ticks = [max, max / 2, 0];
  const fs = compact ? 11 : 13;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={ariaLabel}>
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={left} x2={width - 8} y1={y(t)} y2={y(t)} stroke="var(--border)" />
          <text x={left - 6} y={y(t) + 4} textAnchor="end" fontSize={fs} className="fill-muted-foreground">
            {formatBedragKort(t)}
          </text>
        </g>
      ))}
      {cols.map((c, i) => {
        const s = seg(c.v);
        const cx = left + slot * i + slot / 2;
        const focused = c.idx === focusIdx;
        const opacity = focused ? 1 : 0.55;
        return (
          <g
            key={c.j.key}
            data-testid="evolution-column"
            data-focused={focused}
            role={onSelect ? "button" : undefined}
            tabIndex={onSelect ? 0 : undefined}
            aria-label={`${c.j.label}: ${formatBedragKort(s.los + s.productie)}`}
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
            className={onSelect ? "cursor-pointer outline-none focus-visible:opacity-100" : undefined}
          >
            <rect x={cx - slot / 2} y={top} width={slot} height={plotH + bottom} fill="transparent" />
            <rect x={cx - barW / 2} y={y(s.los)} width={barW} height={plotH + top - y(s.los)} fill="var(--chart-2)" opacity={opacity} />
            <rect x={cx - barW / 2} y={y(s.los + s.productie)} width={barW} height={y(s.los) - y(s.los + s.productie)} fill="var(--chart-1)" opacity={opacity} />
            <text x={cx} y={height - (compact ? 6 : 10)} textAnchor="middle" fontSize={fs} fontWeight={focused ? 700 : 400} className="fill-muted-foreground">
              {c.j.label}
              {c.j.isYtd ? " \u2022 YTD" : ""}
            </text>
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
      title="Omzetevolutie"
      note={
        model.modus === "JAREN" ? (
          <span className="flex flex-wrap gap-4">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block size-2.5" style={{ background: "var(--chart-1)" }} /> Productie
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block size-2.5" style={{ background: "var(--chart-2)" }} /> Los
            </span>
            <span>Klik op een jaar om het focusjaar te wijzigen.</span>
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
