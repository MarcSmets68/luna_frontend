"use client";

import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { computeMovers, type Mover } from "../../lib/dashboard-aggregations";
import type { DashboardModel, OmzetType } from "../../lib/dashboard-types";
import { formatGrowth, formatInteger } from "../../lib/omzetanalyse-format";
import { BarRow } from "./bar-row";
import { DashboardSection } from "./dashboard-section";
import { perDealerNoticeText, SectionNotice } from "./section-notice";

function MoverList({
  items,
  color,
  title,
  onSelect,
}: {
  items: Mover[];
  color: string;
  title: string;
  onSelect: (klnr: number) => void;
}) {
  const max = Math.max(1, ...items.map((m) => Math.abs(m.delta)));
  return (
    <div>
      <h4 className="mb-2 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">{title}</h4>
      {items.length === 0 ? (
        <p className="text-[13px] text-muted-foreground">Geen dealers.</p>
      ) : (
        <ul className="-mx-1">
          {items.map((m) => (
            <li key={m.klnr} data-testid="mover-row">
              <BarRow
                name={
                  <>
                    {m.naam}
                    {m.status === "nieuw" && (
                      <Badge variant="outline" className="ml-2">nieuw</Badge>
                    )}
                    {m.status === "weg" && (
                      <Badge variant="outline" className="ml-2">geen omzet meer</Badge>
                    )}
                  </>
                }
                value={Math.abs(m.delta)}
                max={max}
                color={color}
                sub={
                  <>
                    {m.delta > 0 ? "+" : "\u2212"}
                    {"\u20AC\u00A0"}
                    {formatInteger(Math.abs(m.delta))}
                    {m.pct !== null && (
                      <span className="block text-[11px]">{formatGrowth(m.pct)}</span>
                    )}
                  </>
                }
                onClick={() => onSelect(m.klnr)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Movers({
  model,
  focusIdx,
  type,
  onSelect,
}: {
  model: DashboardModel;
  focusIdx: number;
  type: OmzetType;
  onSelect: (klnr: number) => void;
}) {
  const last = model.jaren.length - 1;
  const [aOverride, setA] = useState<number | null>(null);
  const [bOverride, setB] = useState<number | null>(null);
  const bIdx = bOverride ?? focusIdx;
  const aIdx = aOverride ?? (focusIdx + 1 <= last ? focusIdx + 1 : focusIdx);
  const result = useMemo(
    () => computeMovers(model.dealers, aIdx, bIdx, type, 8),
    [model.dealers, aIdx, bIdx, type]
  );

  if (!model.perDealer || model.modus === "PERIODE") {
    return (
      <DashboardSection title="Stijgers en dalers">
        <SectionNotice>
          {model.modus === "PERIODE" && model.perDealer
            ? "Niet beschikbaar bij een periodefilter. Verwijder datum van/tot voor de jaarvergelijking."
            : perDealerNoticeText()}
        </SectionNotice>
      </DashboardSection>
    );
  }

  const items = model.jaren.map((j, i) => ({
    value: String(i),
    label: j.isYtd ? `${j.label} (lopend)` : j.label,
  }));
  const sel = (label: string, value: number, onChange: (n: number) => void) => (
    <label className="flex items-center gap-2 text-[13px] text-muted-foreground">
      {label}
      <Select items={items} value={String(value)} onValueChange={(v) => v && onChange(Number(v))}>
        <SelectTrigger aria-label={label} className="w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map((i) => (
            <SelectItem key={i.value} value={i.value}>
              {i.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
  const s = result.summary;
  const ytdWarn =
    (model.jaren[aIdx]?.isYtd || model.jaren[bIdx]?.isYtd) && aIdx !== bIdx
      ? " Een lopend jaar tegenover een volledig jaar overdrijft het aantal dalers."
      : "";
  const kindTxt = type === "totaal" ? "los en productie" : type;
  return (
    <DashboardSection
      title="Stijgers en dalers"
      actions={
        <div className="flex items-center gap-3">
          {sel("Van", aIdx, setA)}
          {sel("Naar", bIdx, setB)}
        </div>
      }
      note={
        <span data-testid="movers-summary">
          {s.nRisers} stijgen, {s.nFallers} dalen ({s.nNieuw} nieuw, {s.nWeg} geen omzet meer) &middot; netto{" "}
          {s.nettoDelta < 0 ? "\u2212" : "+"}
          {"\u20AC\u00A0"}
          {formatInteger(Math.abs(s.nettoDelta))} ({kindTxt},{" "}
          {model.jaren[aIdx]?.label} &rarr; {model.jaren[bIdx]?.label}).{ytdWarn}
        </span>
      }
    >
      {aIdx === bIdx ? (
        <SectionNotice>Kies twee verschillende jaren om te vergelijken.</SectionNotice>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <MoverList items={result.risers} color="var(--chart-1)" title="Stijgers" onSelect={onSelect} />
          <MoverList items={result.fallers} color="var(--chart-4)" title="Dalers" onSelect={onSelect} />
        </div>
      )}
    </DashboardSection>
  );
}
