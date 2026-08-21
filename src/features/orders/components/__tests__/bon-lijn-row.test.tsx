import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Table, TableBody } from "@/components/ui/table";
import { BonLijnRow } from "../bon-lijn-row";
import type { BonLijnItem } from "@/lib/api-client";

const baseLijn: BonLijnItem = {
  bonnr: 1234567,
  lijnnr: 1,
  stempel: "",
  artnr: "ART-001",
  omschrijving: "LED profiel 2m",
  aantal: 10,
  teLeveren: 10,
  besteld: 0,
  vprijs: 45.5,
  aprijs: 45.5,
  korting: 0,
  btwKode: "1",
  bedrag: 455,
  levDatum: "2026-08-20",
  bestelDatum: "2026-08-01",
  klnr: 14644,
  groepnr: 1,
  subgroepnr: 1,
  hold: false,
  opm: "",
  subtotaal: false,
  kolomtitel: false,
  infolijn: false,
};

function renderRow(lijn: BonLijnItem) {
  return render(
    <Table>
      <TableBody>
        <BonLijnRow lijn={lijn} />
      </TableBody>
    </Table>
  );
}

describe("BonLijnRow", () => {
  it("renders a normal artikelregel with all columns", () => {
    renderRow(baseLijn);
    expect(screen.getByText("ART-001")).toBeInTheDocument();
    expect(screen.getByText("LED profiel 2m")).toBeInTheDocument();
    expect(screen.getAllByText("10")).toHaveLength(2);
    expect(screen.getByText("455,00")).toBeInTheDocument();
  });

  it("renders a kolomtitel row with only the omschrijving", () => {
    renderRow({ ...baseLijn, kolomtitel: true, omschrijving: "Groep A" });
    expect(screen.getByText("Groep A")).toBeInTheDocument();
    expect(screen.queryByText("ART-001")).not.toBeInTheDocument();
    expect(screen.queryByText("455,00")).not.toBeInTheDocument();
  });

  it("renders a subtotaal row with only the bedrag (and omschrijving)", () => {
    renderRow({ ...baseLijn, subtotaal: true, omschrijving: "Subtotaal", bedrag: 999.99 });
    expect(screen.getByText("Subtotaal")).toBeInTheDocument();
    expect(screen.getByText("999,99")).toBeInTheDocument();
    expect(screen.queryByText("ART-001")).not.toBeInTheDocument();
  });

  it("renders an infolijn row with only the omschrijving", () => {
    renderRow({ ...baseLijn, infolijn: true, omschrijving: "Let op: leveringstermijn 6 weken" });
    expect(screen.getByText("Let op: leveringstermijn 6 weken")).toBeInTheDocument();
    expect(screen.queryByText("ART-001")).not.toBeInTheDocument();
    expect(screen.queryByText("455,00")).not.toBeInTheDocument();
  });
}); 
