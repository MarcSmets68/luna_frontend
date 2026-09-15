import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OfferteCreatePage } from "../offerte-create-page";
import type { KlantItem } from "@/lib/api-client";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const createOfferteMock = vi.fn();
const createOfflijnMock = vi.fn();
vi.mock("@/lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-client")>("@/lib/api-client");
  return {
    ...actual,
    createOfferte: (...args: unknown[]) => createOfferteMock(...args),
    createOfflijn: (...args: unknown[]) => createOfflijnMock(...args),
  };
});

const mockKlant: KlantItem = {
  klnr: 14644,
  naam: "CONE LIGHTING BV",
  naam1: "",
  contact: "Jan Janssens",
  adres: "Catershoflaan 70-76",
  postnr: "2170",
  stad: "Merksem",
  land: "BE",
  tel: "",
  fax: "",
  gsm: "",
  email: "",
  taal: "N",
  munt: "EUR",
  btwNr: "",
  saldo: 0,
  geblokkeerd: false,
  opm: "",
};

beforeEach(() => {
  pushMock.mockReset();
  createOfferteMock.mockReset();
  createOfflijnMock.mockReset();
  sessionStorage.clear();
});

describe("OfferteCreatePage", () => {
  it("renders the heading and prefills naam/adres/postnr/stad/munt from the klant", () => {
    render(<OfferteCreatePage klant={mockKlant} />);
    expect(screen.getByRole("heading", { name: "Nieuwe offerte" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Naam" })).toHaveValue("CONE LIGHTING BV");
    expect(screen.getByRole("textbox", { name: "Adres" })).toHaveValue("Catershoflaan 70-76");
    expect(screen.getByRole("textbox", { name: "Stad" })).toHaveValue("Merksem");
    expect(screen.getByText("14644")).toBeInTheDocument();
  });

  it("rejects a missing datum without calling the API", async () => {
    const user = userEvent.setup();
    render(<OfferteCreatePage klant={mockKlant} />);

    const datumInput = screen.getByLabelText("Datum") as HTMLInputElement;
    await user.clear(datumInput);
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Datum is verplicht.")).toBeInTheDocument();
    expect(createOfferteMock).not.toHaveBeenCalled();
  });

  it("creates the offerte and navigates to its detail page on success with no lines", async () => {
    const user = userEvent.setup();
    createOfferteMock.mockResolvedValue({ offnr: 999, versie: 1, klnr: 14644 });

    render(<OfferteCreatePage klant={mockKlant} />);
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(createOfferteMock).toHaveBeenCalledTimes(1));
    expect(createOfferteMock).toHaveBeenCalledWith(
      expect.objectContaining({ klnr: 14644, naam: "CONE LIGHTING BV" })
    );
    expect(createOfflijnMock).not.toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith("/offertes/999/1");
  });

  it("creates offlijnen sequentially after the offerte and navigates to the detail page", async () => {
    const user = userEvent.setup();
    createOfferteMock.mockResolvedValue({ offnr: 999, versie: 1, klnr: 14644 });
    createOfflijnMock.mockResolvedValue({ offnr: 999, versie: 1, lijnnr: 10 });

    render(<OfferteCreatePage klant={mockKlant} />);

    await user.type(screen.getByRole("textbox", { name: "Artnr nieuwe lijn" }), "ABC");
    await user.click(screen.getByRole("button", { name: /lijn toevoegen/i }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(createOfflijnMock).toHaveBeenCalledTimes(1));
    expect(createOfflijnMock).toHaveBeenCalledWith(
      999,
      1,
      expect.objectContaining({ artnr: "ABC" })
    );
    expect(pushMock).toHaveBeenCalledWith("/offertes/999/1");
  });

  it("redirects with lijnFout=1 and stashes the failures in sessionStorage when a line fails", async () => {
    const user = userEvent.setup();
    createOfferteMock.mockResolvedValue({ offnr: 999, versie: 1, klnr: 14644 });
    createOfflijnMock.mockRejectedValue(new Error("400 Bad Request"));

    render(<OfferteCreatePage klant={mockKlant} />);

    await user.type(screen.getByRole("textbox", { name: "Artnr nieuwe lijn" }), "ABC");
    await user.click(screen.getByRole("button", { name: /lijn toevoegen/i }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(pushMock).toHaveBeenCalledWith("/offertes/999/1?lijnFout=1")
    );
    const stored = sessionStorage.getItem("luna:offerte-lijn-fout:999:1");
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored as string);
    expect(parsed.failed[0].error).toBe("400 Bad Request");
  });

  it("shows an error and does not navigate when the header create call fails", async () => {
    const user = userEvent.setup();
    createOfferteMock.mockRejectedValue(new Error("klnr is verplicht"));

    render(<OfferteCreatePage klant={mockKlant} />);
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("klnr is verplicht")).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("navigates back to the klant detail page on cancel", async () => {
    const user = userEvent.setup();
    render(<OfferteCreatePage klant={mockKlant} />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(pushMock).toHaveBeenCalledWith("/klanten/14644");
  });
});
