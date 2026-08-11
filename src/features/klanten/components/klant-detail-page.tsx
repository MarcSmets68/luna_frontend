import { Card, CardContent } from "@/components/ui/card";
import { KlantOffertesList } from "./klant-offertes-list";
import { KlantOrdersList } from "./klant-orders-list";
import type { BonItem, KlantItem, OfferteItem } from "@/lib/api-client";

function formatSaldo(value: number): string {
  return value.toLocaleString("nl-BE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
        {label}
      </div>
      <div className="text-sm text-foreground">{value || "\u2014"}</div>
    </div>
  );
}

export function KlantDetailPage({
  klant,
  offertes,
  offertesPage,
  offertesHasMore,
  orders,
  ordersPage,
  ordersHasMore,
}: {
  klant: KlantItem;
  offertes: OfferteItem[];
  offertesPage: number;
  offertesHasMore: boolean;
  orders: BonItem[];
  ordersPage: number;
  ordersHasMore: boolean;
}) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        Klanten
      </div>
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-[26px] font-bold text-foreground">{klant.naam}</h1>
        <div className="text-[13px] text-[#5e5e5e]">Klantnr {klant.klnr}</div>
      </div>

      <Card className="mb-6">
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <DetailField label="Klantnr" value={String(klant.klnr)} />
            <DetailField label="Naam" value={klant.naam} />
            <DetailField label="Naam 1" value={klant.naam1} />
            <DetailField label="Contact" value={klant.contact} />
            <DetailField label="Adres" value={klant.adres} />
            <DetailField label="Postnr" value={klant.postnr} />
            <DetailField label="Stad" value={klant.stad} />
            <DetailField label="Land" value={klant.land} />
            <DetailField label="Telefoon" value={klant.tel} />
            <DetailField label="Fax" value={klant.fax} />
            <DetailField label="GSM" value={klant.gsm} />
            <DetailField label="E-mail" value={klant.email} />
            <DetailField label="Taal" value={klant.taal} />
            <DetailField label="Munt" value={klant.munt} />
            <DetailField label="BTW-nr" value={klant.btwNr} />
            <DetailField label="Saldo" value={formatSaldo(klant.saldo)} />
            <DetailField label="Geblokkeerd" value={klant.geblokkeerd ? "Ja" : "Nee"} />
            <DetailField label="Opmerking" value={klant.opm} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <KlantOffertesList
          klnr={klant.klnr}
          items={offertes}
          page={offertesPage}
          hasMore={offertesHasMore}
          ordersPage={ordersPage}
        />
        <KlantOrdersList
          klnr={klant.klnr}
          items={orders}
          page={ordersPage}
          hasMore={ordersHasMore}
          offertesPage={offertesPage}
        />
      </div>
    </div>
  );
}
