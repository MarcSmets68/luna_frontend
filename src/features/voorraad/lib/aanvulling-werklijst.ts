import type { ArtikelItem } from "@/lib/api-client";

export type AanvullingArtikel = Pick<ArtikelItem, "artnr" | "omschrijvingNl" | "groep" | "stock" | "geblokkeerd"> & {
  leverancier: string | null;
  voorraad: number | null;
  gereserveerd: number | null;
  voorraadMin: number | null;
  externAantal: number | null;
  externGereserveerd: number | null;
  openInkoop: number | null;
  bevestigdeLeverdatum: string | null;
};

export type AanvullingMomentopname = {
  artikelen: readonly AanvullingArtikel[];
  peildatum: string | null;
  volledigheid: "volledig" | "afgekapt";
  actualiteit: "actueel" | "verouderd" | "onbekend";
  bron: "voorbeeld" | "live";
};

export interface AanvullingBron {
  lees(): Promise<AanvullingMomentopname | null>;
}

export const signalen = {
  dringend: "Dringend",
  "onder-minimum": "Onder minimum",
  "te-controleren": "Te controleren",
  "geen-signaal": "Geen signaal",
} as const;

type Signaal = keyof typeof signalen;

export type AanvullingZoekparams = {
  [key in "zoek" | "groep" | "leverancier" | "urgentie" | "page"]?: string | string[];
};

const signaalVolgorde: Record<Signaal, number> = {
  dringend: 0,
  "onder-minimum": 1,
  "te-controleren": 2,
  "geen-signaal": 3,
};

export const AANVULLING_PAGE_SIZE = 6;

export function classificeer(artikel: AanvullingArtikel): {
  beschikbaar: number | null;
  signaal: Signaal;
  reden: string;
} {
  const { voorraad, gereserveerd, voorraadMin } = artikel;
  if (voorraad === null || gereserveerd === null || !Number.isFinite(voorraad) || !Number.isFinite(gereserveerd)) {
    return {
      beschikbaar: null,
      signaal: "te-controleren",
      reden: "Interne fysieke voorraad of reservaties onbekend.",
    };
  }

  const beschikbaar = voorraad - gereserveerd;
  if (beschikbaar <= 0) {
    return { beschikbaar, signaal: "dringend", reden: "Intern beschikbaar is nul of negatief." };
  }
  if (voorraadMin === null || !Number.isFinite(voorraadMin) || voorraadMin < 0) {
    return { beschikbaar, signaal: "te-controleren", reden: "Geen geldig intern minimum bekend." };
  }
  if (beschikbaar < voorraadMin) {
    return { beschikbaar, signaal: "onder-minimum", reden: "Intern beschikbaar ligt onder het minimum." };
  }
  return { beschikbaar, signaal: "geen-signaal", reden: "Intern beschikbaar haalt het minimum." };
}

function leesFilter(value: string | string[] | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function opties(waarden: (string | null)[]) {
  return [...new Set(waarden.filter((waarde): waarde is string => Boolean(waarde)))]
    .sort((a, b) => a.localeCompare(b, "nl-BE"));
}

async function leesBron(bron: AanvullingBron) {
  try {
    return await bron.lees();
  } catch {
    return null;
  }
}

export async function laadAanvullingWerklijst(bron: AanvullingBron, params: AanvullingZoekparams) {
  const urgentie = leesFilter(params.urgentie);
  const filters = {
    zoek: leesFilter(params.zoek),
    groep: leesFilter(params.groep),
    leverancier: leesFilter(params.leverancier),
    urgentie: Object.hasOwn(signalen, urgentie) ? urgentie as Signaal : "",
  };

  const snapshot = await leesBron(bron);
  if (!snapshot) {
    return { status: "niet-beschikbaar" as const, filters };
  }

  const { artikelen, ...metadata } = snapshot;
  const actieveArtikelen = artikelen.filter((artikel) => artikel.stock && !artikel.geblokkeerd);
  const zoek = filters.zoek.toLocaleLowerCase("nl-BE");
  const matches = actieveArtikelen
    .filter((artikel) => (!filters.groep || artikel.groep === filters.groep)
      && (!filters.leverancier || artikel.leverancier === filters.leverancier)
      && (!zoek || [artikel.artnr, artikel.omschrijvingNl].some(
        (waarde) => waarde.toLocaleLowerCase("nl-BE").includes(zoek),
      )))
    .map((artikel) => ({ ...artikel, ...classificeer(artikel) }))
    .filter((artikel) => !filters.urgentie || artikel.signaal === filters.urgentie)
    .sort((a, b) => signaalVolgorde[a.signaal] - signaalVolgorde[b.signaal]
      || (a.beschikbaar ?? Infinity) - (b.beschikbaar ?? Infinity)
      || a.artnr.localeCompare(b.artnr, "nl-BE"));

  const paginaParam = Number(leesFilter(params.page));
  const paginaAantal = Math.max(1, Math.ceil(matches.length / AANVULLING_PAGE_SIZE));
  const pagina = Number.isSafeInteger(paginaParam) ? Math.min(paginaAantal, Math.max(1, paginaParam)) : 1;
  const start = (pagina - 1) * AANVULLING_PAGE_SIZE;

  return {
    status: "beschikbaar" as const,
    filters,
    metadata,
    groepen: opties(actieveArtikelen.map(({ groep }) => groep)),
    leveranciers: opties(actieveArtikelen.map(({ leverancier }) => leverancier)),
    artikelen: matches.slice(start, start + AANVULLING_PAGE_SIZE),
    aantal: matches.length,
    pagina,
    paginaAantal,
  };
}
