import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { LakproductieItem } from "@/lib/api-client";
import { BronBadge, StatusBadge } from "./bron-badge";

const DASH = "\u2014";

function formatQty(value: number | null | undefined): string {
  if (value === null || value === undefined) return DASH;
  return value.toLocaleString("nl-BE", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1">
      <span className="text-[12px] text-muted-foreground">{label}</span>
      <span className="text-[13px] font-medium text-foreground">{value}</span>
    </div>
  );
}

/**
 * Popup met de volledige detailgegevens van één orderregel, inclusief de
 * klant - die staat niet meer als kolom in de tabel, maar blijft hier
 * beschikbaar voor wie het nodig heeft.
 */
export function LakproductieDetailDialog({
  item,
  onOpenChange,
}: {
  item: LakproductieItem | null;
  onOpenChange: (open: boolean) => void;
}) {
  const isMinMax = item?.bron === "min-max-voorraad";

  return (
    <Dialog open={item !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {item && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {item.artnr}
                <BronBadge bron={item.bron} />
              </DialogTitle>
              <DialogDescription>{item.omschrijving}</DialogDescription>
            </DialogHeader>

            <div className="divide-y divide-border">
              <div className="py-1">
                <DetailRow label="Klant" value={isMinMax ? DASH : item.klant || DASH} />
                <DetailRow label="Order" value={isMinMax ? "STOCK" : item.bonnr ?? DASH} />
                <DetailRow label="Ordernaam" value={isMinMax ? DASH : item.orderNaam || DASH} />
                <DetailRow label="Orderdatum" value={isMinMax ? DASH : item.orderDatum || DASH} />
                <DetailRow label="Deadline" value={isMinMax ? DASH : item.deadline || DASH} />
                <DetailRow label="Aantal" value={isMinMax ? DASH : formatQty(item.aantal)} />
                <DetailRow label="Verpakking" value={formatQty(item.verpakking)} />
                <DetailRow
                  label="Status"
                  value={
                    isMinMax ? (
                      <>Bestel-advies: {formatQty(item.bestelAdvies)}</>
                    ) : item.status ? (
                      <StatusBadge status={item.status} />
                    ) : (
                      DASH
                    )
                  }
                />
              </div>

              <div className="py-1">
                <DetailRow label="Techniek" value={item.techniek || DASH} />
                <DetailRow label="Kleursoort" value={item.kleursoort || DASH} />
                <DetailRow label="Kleurkode" value={item.kleurkode || DASH} />
                <DetailRow label="Afwerking" value={item.afwerking || DASH} />
                <DetailRow label="Behandeling" value={item.behandeling} />
                <DetailRow label="Leverancier" value={item.lakNaam || DASH} />
              </div>

              <div className="py-1">
                <DetailRow label="Voorraad" value={formatQty(item.voorraad)} />
                <DetailRow label="Gereserveerd" value={formatQty(item.gereserveerdVoorraad)} />
                <DetailRow label="Ext. voorraad" value={formatQty(item.extVoorraad)} />
                <DetailRow label="Ext. gereserveerd" value={formatQty(item.extGereserveerd)} />
              </div>

              <div className="py-1">
                <DetailRow label="Verkoop 1 maand" value={formatQty(item.verkoop1Maand)} />
                <DetailRow label="Verkoop 3 maanden" value={formatQty(item.verkoop3Maand)} />
                <DetailRow label="Verkoop 6 maanden" value={formatQty(item.verkoop6Maand)} />
                <DetailRow label="Verkoop 9 maanden" value={formatQty(item.verkoop9Maand)} />
                <DetailRow label="Verkoop 12 maanden" value={formatQty(item.verkoop12Maand)} />
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
