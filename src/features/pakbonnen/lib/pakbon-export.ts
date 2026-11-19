import type { PakbonItem, PaklijnItem } from "@/lib/api-client";
import { formatDatum } from "@/lib/format";
import { isTitleLine } from "@/lib/line-classification";

export type PakbonPrintRow = {
  kind: "title" | "text" | "article";
  cells: string[];
};

export function buildPakbonRows(lines: PaklijnItem[]): PakbonPrintRow[] {
  return lines
    .filter((line) => !line.subtotaal)
    .map((line) => {
      if (isTitleLine(line.artnr)) {
        return { kind: "title", cells: [line.omschr] };
      }
      if (line.infolijn || line.kolomtitel) {
        return { kind: "text", cells: [line.omschr] };
      }
      return {
        kind: "article",
        cells: [
          String(line.bonnr),
          line.artnr,
          line.omschr,
          new Intl.NumberFormat("nl-BE", { maximumFractionDigits: 0 }).format(line.aantal),
        ],
      };
    });
}

export function buildPakbonSections(pakbon: PakbonItem, lines: PaklijnItem[]) {
  const delivery = [pakbon.lnaam, pakbon.ladres, pakbon.lpostnr, pakbon.lstad];
  const customer = [
    pakbon.naam,
    pakbon.naam1,
    pakbon.adres,
    `${pakbon.postnr} ${pakbon.stad}`.trim(),
  ];
  const deliveryAddress = delivery.every((value) => !value.trim())
    ? customer
    : [pakbon.lnaam, pakbon.ladres, `${pakbon.lpostnr} ${pakbon.lstad}`.trim()];
  const bonnrs = [...new Set(lines.map((line) => line.bonnr).filter((nr) => nr > 0))];
  return {
    header: [
      `Datum: ${formatDatum(pakbon.datum)} | Klantnr: ${pakbon.klnr}`,
      `Bonnr(s): ${bonnrs.join(", ") || "—"}`,
    ],
    sections: [
      ["Factuuradres", ...customer.filter(Boolean)],
      ["Leveradres", ...deliveryAddress.filter(Boolean)],
      ["Uw referentie", pakbon.uRef || "—"],
      ["Verzending / tracknr", [pakbon.verzending, pakbon.tracknr].filter(Boolean).join(" / ") || "—"],
      ...(pakbon.projectnr > 0 ? [["Projectnr", String(pakbon.projectnr)]] : []),
      ...(pakbon.opm ? [["Opmerking", pakbon.opm]] : []),
      ...(pakbon.afgehaald
        ? [[
            "Afgehaald",
            `Afgehaald door ${pakbon.afgehaaldId} op ${formatDatum(pakbon.afgehaaldDatum)}`,
          ]]
        : []),
    ],
  };
}
