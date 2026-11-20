import type { LakproductieBron, LakproductieStatus } from "@/lib/api/lakproductie";

type Bronregel = {
  bron: LakproductieBron;
  bronreferentie: string | null;
  artnr: string;
  omschrijving: string;
  leverancier: string | null;
  behandeling: string | null;
  kleurTechniekAfwerking: string | null;
  openSaldo: number | null;
};

export type TeBestellenRegel = Bronregel & {
  productiedeadline: string | null;
  status: Extract<LakproductieStatus, "Nog te bestellen" | "Deels gereserveerd"> | null;
};

export type BesteldeRegel = Bronregel & {
  bestellingsdatum: string | null;
  beloofdeLeverdatum: string | null;
  ontvangen: boolean | null;
  externeStap: string | null;
};

export type LakordersData = {
  // The source supplies one canonical row per verified need, not one per raw source row.
  teBestellen: Readonly<Record<string, TeBestellenRegel>>;
  besteld: Readonly<Record<string, BesteldeRegel>>;
};

export const ONBEKEND = "Onbekend";
const bronVolgorde = new Intl.Collator("nl-BE", { numeric: true });
const brusselseDatum = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Brussels" });

export function brusselseDag(datum: Date): string {
  return brusselseDatum.format(datum);
}

function geldigeDatum(datum: string | null): string | null {
  if (!datum || !/^\d{4}-\d{2}-\d{2}$/.test(datum)) return null;
  const tijdstip = new Date(`${datum}T00:00:00Z`);
  return Number.isFinite(+tijdstip) && tijdstip.toISOString().slice(0, 10) === datum ? datum : null;
}

function sorteerOpDatum<T extends Bronregel & { id: string }>(
  regels: T[],
  datumVan: (regel: T) => string | null,
): T[] {
  return regels.sort((a, b) => {
    const datumA = datumVan(a) ?? "\uffff";
    const datumB = datumVan(b) ?? "\uffff";
    if (datumA !== datumB) return datumA < datumB ? -1 : 1;
    if (a.bronreferentie !== b.bronreferentie) {
      if (a.bronreferentie === null) return 1;
      if (b.bronreferentie === null) return -1;
      const volgorde = bronVolgorde.compare(a.bronreferentie, b.bronreferentie);
      if (volgorde) return volgorde;
    }
    return a.id.localeCompare(b.id);
  });
}

export function maakLakordersWerklijsten(bron: LakordersData, vandaag: string) {
  return {
    teBestellen: sorteerOpDatum(
      Object.entries(bron.teBestellen).map(([id, regel]) => ({
        ...regel,
        id,
        productiedeadline: geldigeDatum(regel.productiedeadline),
        status: regel.status ?? ONBEKEND,
      })),
      (regel) => regel.productiedeadline,
    ),
    besteld: sorteerOpDatum(
      Object.entries(bron.besteld)
        .filter(([, regel]) => regel.ontvangen !== true)
        .map(([id, regel]) => {
          const beloofdeLeverdatum = geldigeDatum(regel.beloofdeLeverdatum);
          const status = !beloofdeLeverdatum
            ? "Niet bevestigd"
            : regel.ontvangen !== false
              ? "Ontvangst onbekend"
              : beloofdeLeverdatum < vandaag
                ? "Levering te laat"
                : "Levering bevestigd";
          return {
            ...regel,
            id,
            bestellingsdatum: geldigeDatum(regel.bestellingsdatum),
            beloofdeLeverdatum,
            status,
          };
        }),
      (regel) => regel.beloofdeLeverdatum,
    ),
  };
}
