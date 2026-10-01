import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { NppReservatieDetailItem } from "../../types";
import { ReservatieDetailRow } from "../reservatie-detail-row";

const base: NppReservatieDetailItem = {
  lijnnr: 10,
  groepnr: 0,
  artnr: "ART-1",
  omschrijving: "Profiel",
  teLeveren: 5,
  gereserv: 4,
  effectiefGereserv: 2,
  swEffectief: false,
  effectiefStatus: "gedeeltelijk_effectief",
  kolomtitel: false,
  infolijn: false,
  subtotaal: false,
};

describe("ReservatieDetailRow", () => {
  it("renders an item line with quantities and a text status pill", () => {
    render(<ReservatieDetailRow item={base} />);
    expect(screen.getByText("ART-1")).toBeInTheDocument();
    expect(screen.getByText("Profiel")).toBeInTheDocument();
    expect(screen.getByText(/Te leveren: 5/)).toBeInTheDocument();
    expect(screen.getByText("Gedeeltelijk")).toBeInTheDocument();
  });

  it.each([
    ["kolomtitel", "font-bold"],
    ["infolijn", "italic"],
    ["subtotaal", "border"],
  ] as const)("renders %s lines without pill or quantities", (flag, cls) => {
    render(
      <ReservatieDetailRow
        item={{
          ...base,
          effectiefStatus: null,
          omschrijving: "Tekst",
          [flag]: true,
        }}
      />,
    );
    expect(screen.getByText("Tekst").className).toContain(cls);
    expect(screen.queryByText(/Te leveren/)).not.toBeInTheDocument();
    expect(screen.queryByText("Gedeeltelijk")).not.toBeInTheDocument();
  });
});
