import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OfferteEditPage } from "../offerte-edit-page";
import type { OfferteItem, OfflijnItem } from "@/lib/api-client";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const updateOfferteMock = vi.fn();
const deleteOfferteMock = vi.fn();
vi.mock("@/lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-client")>("@/lib/api-client");
  return {
    ...actual,
    updateOfferte: (...args: unknown[]) => updateOfferteMock(...args),
    deleteOfferte: (...args: unknown[]) => deleteOfferteMock(...args),
  };
});

const OFFERTE: OfferteItem = {
  offnr: 999999,
  versie: 1,
  datum: "2026-01-01",
  klnr: 100,
  naam: "Test offerte",
  adres: "",
  postnr: "",
  stad: "",
  munt: "EUR",
  bedrag: 0,
  btw: 0,
  offgroep: "",
  soort: "",
  passief: false,
  verloren: true,
  verkocht: false,
  verkoopkans: 0,
  uRef: "",
  besteldatum: null,
  verkochtdatum: null,
  opm: "",
};

const LIJNEN: OfflijnItem[] = [
  {
    offnr: 999999,
    versie: 1,
    lijnnr: 10,
    groepnr: 0,
    subgroepnr: 0,
    artnr: "TESTART",
    omschrijving: "Test artikel",
    omschrijvingOfferte: "Test artikel",
    aantal: 2,
    teLeveren: 0,
    verkoopprijs: 50,
    brutoVerkoopprijs: 0,
    korting: 0,
    btwKode: "21",
    bedrag: 100,
    bruto: 0,
    aankoopprijs: 0,
    opm: "",
    bestellen: false,
    blokkeren: false,
    subtotaal: false,
    kolomtitel: false,
    infolijn: false,
  },
];

beforeEach(() => {
  pushMock.mockReset();
  updateOfferteMock.mockReset();
  deleteOfferteMock.mockReset();
});

describe("OfferteEditPage", () => {
  it("renders the heading and prefilled fields", () => {
    render(<OfferteEditPage offerte={OFFERTE} lijnen={LIJNEN} />);
    expect(
      screen.getByRole("heading", { name: "Offerte 999999/1 bewerken" })
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Naam" })).toHaveValue("Test offerte");
  });

  it("shows the read-only verloren note", () => {
    render(<OfferteEditPage offerte={OFFERTE} lijnen={LIJNEN} />);
    expect(screen.getByText("Verloren")).toBeInTheDocument();
    expect(
      screen.getByText("Wordt automatisch uitgeschakeld zodra je een ander veld opslaat.")
    ).toBeInTheDocument();
  });

  it("shows the sum of line bedrag values as the total", () => {
    render(<OfferteEditPage offerte={OFFERTE} lijnen={LIJNEN} />);
    expect(screen.getByTestId("offerte-totaal")).toHaveTextContent("100,00");
  });

  it("saves via updateOfferte without sending verloren", async () => {
    const user = userEvent.setup();
    updateOfferteMock.mockResolvedValue({ ...OFFERTE, verloren: false });

    render(<OfferteEditPage offerte={OFFERTE} lijnen={LIJNEN} />);
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(updateOfferteMock).toHaveBeenCalledTimes(1));
    const [offnr, versie, payload] = updateOfferteMock.mock.calls[0];
    expect(offnr).toBe(999999);
    expect(versie).toBe(1);
    expect(payload).not.toHaveProperty("verloren");
  });

  it("requires confirmation before deleting, then redirects on success", async () => {
    const user = userEvent.setup();
    deleteOfferteMock.mockResolvedValue({ status: "deleted", offnr: 999999, versie: 1 });

    render(<OfferteEditPage offerte={OFFERTE} lijnen={LIJNEN} />);

    await user.click(screen.getByRole("button", { name: "Offerte verwijderen" }));
    expect(deleteOfferteMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Verwijderen" }));

    await waitFor(() => expect(deleteOfferteMock).toHaveBeenCalledWith(999999, 1));
    expect(pushMock).toHaveBeenCalledWith("/offertes/alle");
  });

  it("cancels the delete confirmation without calling deleteOfferte", async () => {
    const user = userEvent.setup();
    render(<OfferteEditPage offerte={OFFERTE} lijnen={LIJNEN} />);

    await user.click(screen.getByRole("button", { name: "Offerte verwijderen" }));
    await user.click(screen.getByRole("button", { name: "Annuleren" }));

    expect(deleteOfferteMock).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
