import type { PakbonItem, PaklijnItem } from "@/lib/api-client";
import { formatDatum } from "@/lib/format";
import { isTitleLine } from "@/lib/line-classification";

export type PakbonPrintRow = {
  kind: "order" | "title" | "text" | "article";
  cells: string[];
};

export function buildPakbonRows(lines: PaklijnItem[]): PakbonPrintRow[] {
  const rows: PakbonPrintRow[] = [];
  let previousOrder: number | undefined;
  for (const line of lines) {
    if (line.subtotaal) {
      continue;
    }
    if (line.bonnr !== previousOrder) {
      if (line.bonnr > 0) {
        const digits = String(line.bonnr).padStart(7, "0");
        const order = `${digits.slice(0, -4)},${digits.slice(-4)}`;
        rows.push({ kind: "order", cells: [`# ORDERBEVESTIGING :     ${order}`] });
      }
      previousOrder = line.bonnr;
    }
    if (isTitleLine(line.artnr)) {
      rows.push({ kind: "title", cells: [line.omschr] });
    } else if (line.infolijn || line.kolomtitel) {
      rows.push({ kind: "text", cells: [line.omschr] });
    } else {
      rows.push({
        kind: "article",
        cells: [
          line.artnr,
          line.omschr,
          line.aantal === 0
            ? ""
            : new Intl.NumberFormat("nl-BE", { maximumFractionDigits: 3 }).format(line.aantal),
        ],
      });
    }
  }
  return rows;
}

export function buildPakbonSections(pakbon: PakbonItem, lines: PaklijnItem[]) {
  const customer = [
    pakbon.naam,
    pakbon.naam1,
    pakbon.adres,
    `${pakbon.postnr} ${pakbon.stad}`.trim(),
  ];
  const deliveryAddress = [
    pakbon.lnaam || pakbon.naam,
    pakbon.naam1,
    pakbon.ladres || pakbon.adres,
    `${pakbon.lpostnr || pakbon.postnr} ${pakbon.lstad || pakbon.stad}`.trim(),
  ];
  const bonnrs = [...new Set(lines.map((line) => line.bonnr).filter((nr) => nr > 0))];
  return {
    header: [
      `Datum: ${formatDatum(pakbon.datum)} | Klantkode: ${pakbon.klnr}`,
      `Bonnr(s): ${bonnrs.join(", ") || "—"}`,
    ],
    sections: [
      ["Facturatieadres", ...customer.filter(Boolean)],
      ["Leveradres", ...deliveryAddress.filter(Boolean)],
      ["Uw ref.", pakbon.uRef || "—"],
      ["Transport", [pakbon.verzending, pakbon.tracknr].filter(Boolean).join(" / ") || "—"],
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
