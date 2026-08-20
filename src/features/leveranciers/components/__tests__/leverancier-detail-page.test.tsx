import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { LeverancierDetailPage } from "../leverancier-detail-page";
import type { LeverancierItem } from "@/lib/api-client";

const pushMock = vi.fn();
const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

const updateLeverancierMock = vi.fn();
const deleteLeverancierMock = vi.fn();
vi.mock("@/lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-client")>("@/lib/api-client");
  return {
    ...actual,
    updateLeverancier: (...args: unknown[]) => updateLeverancierMock(...args),
    deleteLeverancier: (...args: unknown[]) => deleteLeverancierMock(...args),
  };
});

const mockLeverancier: LeverancierItem = {
  levnr: 501,
  naam: "COATING PARTNERS BV",
  naam1: "",
  contact: "Jan Janssens",
  adres: "Industrielaan 5",
  postnr: "2170",
  stad: "Merksem",
  land: "BE",
  tel: "03 123 45 67",
  fax: "",
  email: "info@coatingpartners.be",
  taal: "N",
  munt: "EUR",
  btwNr: "BE0123456789",
  saldo: 1234.56,
  opm: "",
  type: false,
  controle: true,
  minBestel: 100,
};

beforeEach(() => {
  pushMock.mockReset();
  refreshMock.mockReset();
  updateLeverancierMock.mockReset();
  deleteLeverancierMock.mockReset();
});

describe("LeverancierDetailPage", () => {
  it("renders the leverancier naam as heading and levnr", () => {
    render(<LeverancierDetailPage leverancier={mockLeverancier} />);
    expect(screen.getByRole("heading", { name: "COATING PARTNERS BV" })).toBeInTheDocument();
    expect(screen.getByText("Levnr 501")).toBeInTheDocument();
  });

  it("does not show editable fields until 'Verbeteren' is clicked", () => {
    render(<LeverancierDetailPage leverancier={mockLeverancier} />);
    expect(screen.queryByRole("textbox", { name: "Naam" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Verbeteren" })).toBeInTheDocument();
  });

  it("switches to editable fields after clicking 'Verbeteren', with levnr staying read-only", async () => {
    const user = userEvent.setup();
    render(<LeverancierDetailPage leverancier={mockLeverancier} />);

    await user.click(screen.getByRole("button", { name: "Verbeteren" }));

    expect(screen.getByRole("textbox", { name: "Naam" })).toHaveValue("COATING PARTNERS BV");
    expect(screen.getByText("Levnr")).toBeInTheDocument();
    expect(screen.getByText("501")).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Levnr" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("saves the edited fields and refreshes on success", async () => {
    const user = userEvent.setup();
    updateLeverancierMock.mockResolvedValue({ ...mockLeverancier, naam: "COATING PARTNERS NV" });

    render(<LeverancierDetailPage leverancier={mockLeverancier} />);

    await user.click(screen.getByRole("button", { name: "Verbeteren" }));

    const naamInput = screen.getByRole("textbox", { name: "Naam" });
    await user.clear(naamInput);
    await user.type(naamInput, "COATING PARTNERS NV");

    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(updateLeverancierMock).toHaveBeenCalledTimes(1));
    expect(updateLeverancierMock).toHaveBeenCalledWith(
      501,
      expect.objectContaining({ naam: "COATING PARTNERS NV", saldo: 1234.56 })
    );
    // levnr is the immutable primary key - it must never be part of the
    // update payload (the backend also excludes it, see UpdateLeverancierPayload).
    const [, payload] = updateLeverancierMock.mock.calls[0];
    expect(payload).not.toHaveProperty("levnr");
    expect(refreshMock).toHaveBeenCalled();
  });

  it("sends type/controle as real booleans (not strings) in the update payload", async () => {
    const user = userEvent.setup();
    updateLeverancierMock.mockResolvedValue(mockLeverancier);

    render(<LeverancierDetailPage leverancier={mockLeverancier} />);

    await user.click(screen.getByRole("button", { name: "Verbeteren" }));
    // mockLeverancier starts with type=false, controle=true - toggle both.
    await user.click(screen.getByRole("checkbox", { name: /^Type/ }));
    await user.click(screen.getByRole("checkbox", { name: /^Controle/ }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(updateLeverancierMock).toHaveBeenCalledTimes(1));
    const [, payload] = updateLeverancierMock.mock.calls[0];
    expect(payload.type).toBe(true);
    expect(payload.controle).toBe(false);
  });

  it("reverts changes and does not call the API on cancel", async () => {
    const user = userEvent.setup();
    render(<LeverancierDetailPage leverancier={mockLeverancier} />);

    await user.click(screen.getByRole("button", { name: "Verbeteren" }));
    const naamInput = screen.getByRole("textbox", { name: "Naam" });
    await user.clear(naamInput);
    await user.type(naamInput, "Foutieve naam");

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(updateLeverancierMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("textbox", { name: "Naam" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "COATING PARTNERS BV" })).toBeInTheDocument();
  });

  it("shows an error and stays in edit mode when the API call fails", async () => {
    const user = userEvent.setup();
    updateLeverancierMock.mockRejectedValue(new Error("Leverancier 501 not found"));

    render(<LeverancierDetailPage leverancier={mockLeverancier} />);

    await user.click(screen.getByRole("button", { name: "Verbeteren" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Leverancier 501 not found")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("renders a back link to the leveranciers overview", () => {
    render(<LeverancierDetailPage leverancier={mockLeverancier} />);
    expect(screen.getByRole("link", { name: /Terug naar overzicht/ })).toHaveAttribute(
      "href",
      "/leveranciers"
    );
  });

  it("opens the delete dialog when 'Verwijderen' is clicked and navigates to the overview on confirm", async () => {
    const user = userEvent.setup();
    deleteLeverancierMock.mockResolvedValue({ status: "deleted", levnr: 501 });

    render(<LeverancierDetailPage leverancier={mockLeverancier} />);

    await user.click(screen.getByRole("button", { name: "Verwijderen" }));
    expect(
      screen.getByText(/Leverancier COATING PARTNERS BV \(501\) verwijderen\?/)
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Ja, verwijderen" }));

    await waitFor(() => expect(deleteLeverancierMock).toHaveBeenCalledWith(501));
    expect(pushMock).toHaveBeenCalledWith("/leveranciers");
  });
});
