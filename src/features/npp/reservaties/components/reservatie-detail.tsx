"use client";

import { useReservatieDetail } from "../hooks/use-reservatie-detail";
import { ReservatieDetailRow } from "./reservatie-detail-row";

const EUR = new Intl.NumberFormat("nl-BE", {
  style: "currency",
  currency: "EUR",
});

export function ReservatieDetail({
  bonnr,
  groepnr,
}: {
  bonnr: number;
  groepnr?: number;
}) {
  const { data, loading, error } = useReservatieDetail(bonnr, groepnr);

  return (
    <div className="flex w-full flex-col gap-6 p-6 sm:p-8">
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {loading && (
        <p className="text-sm text-muted-foreground">
          Reservatie wordt geladen...
        </p>
      )}

      {data && (
        <>
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h1 className="font-heading text-xl font-semibold text-foreground">
              Bon {data.bonnr}
              {data.groepnr > 0 && <> &middot; LVB {data.groepnr}</>}
            </h1>
            <span className="text-base font-medium text-foreground">
              {EUR.format(data.nBedrag)}
            </span>
          </div>

          {data.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Geen lijnen gevonden.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {data.items.map((item) => (
                <ReservatieDetailRow
                  key={`${item.groepnr}-${item.lijnnr}`}
                  item={item}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
