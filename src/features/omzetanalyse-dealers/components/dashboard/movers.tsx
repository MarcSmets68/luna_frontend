"use client";

import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { computeMovers, type Mover } from "../../lib/dashboard-aggregations";
import type { DashboardModel, OmzetType } from "../../lib/dashboard-types";
import { formatGrowth, formatInteger } from "../../lib/omzetanalyse-format";
import { DashboardSection } from "./dashboard-section";
import { perDealerNoticeText, SectionNotice } from "./section-notice";

function MoverList({ items, color, title }: { items: Mover[]; color: string; title: string }) {
  const max = Math.max(1, ...items.map((m) => Math.abs(m.delta)));
  return (
    <div>
      <h4 className="mb-2 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">{title}</h4>
      {items.length === 0 ? (
        <p className="text-[13px] text-muted-foreground">Geen dealers.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((m) => (
            <li key={m.klnr} data-testid="mover-row" className="text-[13px]">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-medium text-foreground">
                  {m.naam}
                  {m.status === "nieuw" && (
                    <Badge variant="outline" className="ml-2">nieuw</Badge>
                  )}
                  {m.status === "weg" && (
                    <Badge variant="outline" className="ml-2">geen omzet meer</Badge>
                  )}
                </span>
                <span className="whitespace-nowrap text-muted-foreground">
                  {m.delta > 0 ? "+" : "\u2212"}
                  {formatInteger(Math.abs(m.delta))}
                  {m.pct !== null && ` (${formatGrowth(m.pct)})`}
                </span>
              </div>
              <div className="mt-1 h-1.5 bg-muted">
                <div className="h-full" style={{ width: `${(Math.abs(m.delta) / max) * 100}%`, background: color }} />
              </div>
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
}: {
  model: DashboardModel;
  focusIdx: number;
  type: OmzetType;
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
            : perDealerNoticeText(model)}
        </SectionNotice>
      </DashboardSection>
    );
  }

  const items = model.jaren.map((j, i) => ({ value: String(i), label: j.label }));
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
          {s.nRisers} stijgers, {s.nFallers} dalers ({s.nNieuw} nieuw, {s.nWeg} geen omzet meer) &middot; netto{" "}
          {s.nettoDelta < 0 ? "\u2212" : "+"}
          {"\u20AC\u00A0"}
          {formatInteger(Math.abs(s.nettoDelta))}
        </span>
      }
    >
      <div className="grid gap-6 md:grid-cols-2">
        <MoverList items={result.risers} color="var(--chart-1)" title="Top stijgers" />
        <MoverList items={result.fallers} color="var(--chart-4)" title="Top dalers" />
      </div>
    </DashboardSection>
  );
}
