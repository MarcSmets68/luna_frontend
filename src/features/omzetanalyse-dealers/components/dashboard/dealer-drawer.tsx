"use client";

import { useMemo } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { chronological, dealerDetail } from "../../lib/dashboard-aggregations";
import type { DashboardModel, OmzetType } from "../../lib/dashboard-types";
import { formatInteger, formatQty } from "../../lib/omzetanalyse-format";
import { StackedColumns } from "./evolution-chart";

export function DealerDrawer({
  model,
  klnr,
  focusIdx,
  type,
  onClose,
}: {
  model: DashboardModel;
  klnr: number | null;
  focusIdx: number;
  type: OmzetType;
  onClose: () => void;
}) {
  const detail = useMemo(
    () => (klnr === null ? null : dealerDetail(model, klnr, focusIdx, type)),
    [model, klnr, focusIdx, type]
  );
  const dealer = model.dealers.find((d) => d.klnr === klnr);
  const years = chronological(model.jaren.map((j, idx) => ({ ...j, idx })));
  const heading = "text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase";

  return (
    <Sheet open={klnr !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        {detail && dealer && (
          <>
            <SheetHeader>
              <SheetTitle>{dealer.naam}</SheetTitle>
              <SheetDescription>
                {detail.rank !== null
                  ? `#${detail.rank} van ${detail.ofTotal}`
                  : `Geen omzet in ${model.jaren[focusIdx]?.label ?? ""}`}
              </SheetDescription>
            </SheetHeader>
            <div className="grid grid-cols-3 gap-3">
              {detail.kpis.map((k) => (
                <div key={k.key} className="border-t border-border pt-2">
                  <div className="text-[12px] text-muted-foreground">{k.label}</div>
                  <div className="text-base font-bold whitespace-nowrap">{k.value}</div>
                </div>
              ))}
            </div>
            {model.modus === "JAREN" && (
              <StackedColumns
                compact
                jaren={model.jaren}
                values={detail.perJaar}
                focusIdx={focusIdx}
                type={type}
                ariaLabel={`Omzet per jaar voor ${dealer.naam}`}
              />
            )}
            <div>
              <h4 className={heading}>Top productgroepen</h4>
              {detail.topGroepen.length === 0 ? (
                <p className="mt-1 text-[13px] text-muted-foreground">Geen hoeveelheden.</p>
              ) : (
                <ul className="mt-1 space-y-0.5 text-[13px]">
                  {detail.topGroepen.map((g) => (
                    <li key={`${g.categorie}-${g.unit}`} className="flex justify-between">
                      <span>{g.categorie}</span>
                      <span>
                        {formatQty(g.qty)} {g.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h4 className={heading}>Per jaar</h4>
              <table className="mt-1 w-full text-[13px]">
                <thead className="text-[11px] text-muted-foreground">
                  <tr>
                    <th className="text-left font-semibold">Jaar</th>
                    <th className="text-right font-semibold">Ledstrip (m)</th>
                    <th className="text-right font-semibold">Cover (m)</th>
                    <th className="text-right font-semibold">Orders</th>
                  </tr>
                </thead>
                <tbody>
                  {years.map((y) => (
                    <tr key={y.key}>
                      <td>{y.label}</td>
                      <td className="text-right">{formatQty(detail.ledstrip[y.idx] ?? 0)}</td>
                      <td className="text-right">{formatQty(detail.cover[y.idx] ?? 0)}</td>
                      <td className="text-right">{formatInteger(detail.orders[y.idx] ?? 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
