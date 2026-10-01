"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReservaties } from "../hooks/use-reservaties";
import { ReservatieDetail } from "./reservatie-detail";
import { ReservatieModeSwitch } from "./reservatie-mode-switch";
import { ReservatieQueueList } from "./reservatie-queue-list";

export function ReservatiesView() {
  const r = useReservaties();

  return (
    <div className="flex w-full flex-col gap-6 p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-semibold text-foreground">Reservaties</h1>
          <p className="text-sm text-muted-foreground">
            Bons met reservaties die nog opgevolgd moeten worden.
          </p>
        </div>
        {!r.selected && (
          <div className="flex flex-wrap items-center gap-3">
            <ReservatieModeSwitch mode={r.mode} onChange={(m) => void r.setMode(m)} />
            <Button type="button" variant="outline" onClick={() => void r.refresh()} disabled={r.loading}>
              <RefreshCw className={r.loading ? "animate-spin" : undefined} />
              Vernieuwen
            </Button>
          </div>
        )}
      </div>

      {r.selected ? (
        <ReservatieDetail
          item={r.selected}
          detail={r.detail}
          loading={r.detailLoading}
          error={r.detailError}
          onBack={r.closeDetail}
        />
      ) : (
        <>
          {r.error && (
            <p role="alert" className="text-sm text-destructive">
              {r.error}
            </p>
          )}
          <ReservatieQueueList
            items={r.items}
            loading={r.loading}
            mode={r.mode}
            onOpen={(item) => void r.openDetail(item)}
          />
        </>
      )}
    </div>
  );
}
