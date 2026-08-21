import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OfferteLijnenEditor } from "../offerte-lijnen-editor";
import type { OfflijnItem } from "@/lib/api-client";

const deleteOfflijnMock = vi.fn();
const reorderOfflijnMock = vi.fn();
vi.mock("@/lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-client")>("@/lib/api-client");
  return {
    ...actual,
    deleteOfflijn: (...args: unknown[]) => deleteOfflijnMock(...args),
    reorderOfflijn: (...args: unknown[]) => reorderOfflijnMock(...args),
  };
});

function makeLine(overrides: Partial<OfflijnItem>): OfflijnItem {
  return {
    offnr: 999999,
    versie: 1,
    lijnnr: 10,
    groepnr: 0,
    subgroepnr: 0,
    artnr: "",
    omschrijving: "",
    omschrijvingOfferte: "",
    aantal: 0,
    teLeveren: 0,
    verkoopprijs: 0,
    brutoVerkoopprijs: 0,
    korting: 0,
    btwKode: "",
    bedrag: 0,
    bruto: 0,
    aankoopprijs: 0,
    opm: "",
    bestellen: false,
    blokkeren: false,
    subtotaal: false,
    kolomtitel: false,
    infolijn: false,
    ...overrides,
  };
}

const LINES: OfflijnItem[] = [
  makeLine({ lijnnr: 10, kolomtitel: true, omschrijvingOfferte: "Sectie A" }),
  makeLine({
    lijnnr: 20,
    artnr: "ART1",
    omschrijving: "Artikel 1",
    omschrijvingOfferte: "Artikel 1",
    aantal: 2,
    verkoopprijs: 50,
    bedrag: 100,
  }),
  makeLine({ lijnnr: 30, infolijn: true, omschrijvingOfferte: "Let op: dit is een infolijn" }),
  makeLine({ lijnnr: 40, subtotaal: true, omschrijvingOfferte: "Subtotaal A", bedrag: 100 }),
];

beforeEach(() => {
  deleteOfflijnMock.mockReset();
  reorderOfflijnMock.mockReset();
});

describe("OfferteLijnenEditor", () => {
  it("renders every line type appropriately", () => {
    render(<OfferteLijnenEditor offnr={999999} versie={1} lines={LINES} onLinesChange={() => {}} />);

    expect(screen.getByText("Sectie A")).toBeInTheDocument();
    expect(screen.getByText("Let op: dit is een infolijn")).toBeInTheDocument();
    expect(screen.getByText("Subtotaal A")).toBeInTheDocument();
    expect(screen.getByText("ART1")).toBeInTheDocument();
  });

  it("shows an empty state when there are no lines", () => {
    render(<OfferteLijnenEditor offnr={999999} versie={1} lines={[]} onLinesChange={() => {}} />);
    expect(screen.getByText("Nog geen lijnen op deze offerte.")).toBeInTheDocument();
  });

  it("disables the up-arrow on the first row and the down-arrow on the last row", () => {
    render(<OfferteLijnenEditor offnr={999999} versie={1} lines={LINES} onLinesChange={() => {}} />);

    expect(screen.getByRole("button", { name: "Lijn 10 omhoog" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Lijn 40 omlaag" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Lijn 10 omlaag" })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "Lijn 40 omhoog" })).not.toBeDisabled();
  });

  it("reorders a line and replaces local state from the response", async () => {
    const user = userEvent.setup();
    const reordered = [LINES[1], LINES[0], LINES[2], LINES[3]];
    reorderOfflijnMock.mockResolvedValue({ items: reordered });
    const onLinesChange = vi.fn();

    render(
      <OfferteLijnenEditor offnr={999999} versie={1} lines={LINES} onLinesChange={onLinesChange} />
    );

    await user.click(screen.getByRole("button", { name: "Lijn 20 omhoog" }));

    await waitFor(() =>
      expect(reorderOfflijnMock).toHaveBeenCalledWith(999999, 1, 20, "up")
    );
    expect(onLinesChange).toHaveBeenCalledWith(reordered);
  });

  it("deletes a line and removes it from local state", async () => {
    const user = userEvent.setup();
    deleteOfflijnMock.mockResolvedValue({ status: "deleted", offnr: 999999, versie: 1, lijnnr: 20 });
    const onLinesChange = vi.fn();

    render(
      <OfferteLijnenEditor offnr={999999} versie={1} lines={LINES} onLinesChange={onLinesChange} />
    );

    await user.click(screen.getByRole("button", { name: "Lijn 20 verwijderen" }));

    await waitFor(() => expect(deleteOfflijnMock).toHaveBeenCalledWith(999999, 1, 20));
    expect(onLinesChange).toHaveBeenCalledWith(LINES.filter((l) => l.lijnnr !== 20));
  });

  it("opens the create dialog via the + Lijn toevoegen button", async () => {
    const user = userEvent.setup();
    render(<OfferteLijnenEditor offnr={999999} versie={1} lines={LINES} onLinesChange={() => {}} />);

    await user.click(screen.getByRole("button", { name: "+ Lijn toevoegen" }));

    expect(await screen.findByText("Lijn toevoegen")).toBeInTheDocument();
  });
});
