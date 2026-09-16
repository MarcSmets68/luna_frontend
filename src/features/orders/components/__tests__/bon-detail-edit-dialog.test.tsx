import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BonDetailEditDialog } from "../bon-detail-edit-dialog";
import type { BonItem } from "@/lib/api-client";

const updateBonMock = vi.fn();
vi.mock("@/lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-client")>("@/lib/api-client");
  return {
    ...actual,
    updateBon: (...args: unknown[]) => updateBonMock(...args),
  };
});

const mockBon: BonItem = {
  bonnr: 1234567,
  type: "ORDERBEVESTIGING",
  stempel: "",
  datum: "2026-08-07",
  klnr: 14644,
  naam: "CONE LIGHTING BV",
  adres: "CATERSHOFLAAN 70-76",
  postnr: "2170",
  stad: "MERKSEM (ANTWERPEN)",
  munt: "EUR",
  bedrag: 624.49,
  btw: 108.38,
  uRef: "Test order",
  besteldatum: "2026-08-01",
  levDatum: "2026-08-20",
  geparkeerd: false,
  verzonden: false,
  opm: "",
  klnr2: 0,
  klnr3: 0,
  lnaam: "",
  lnaam1: "",
  ladres: "",
  lpostnr: "",
  lstad: "",
  recupelBedrag: 0,
  aBedrag: 0,
};

beforeEach(() => {
  updateBonMock.mockReset();
});

describe("BonDetailEditDialog", () => {
  it("prefills the form from bon, including 0 -> \"0\" for klnr2/klnr3", () => {
    render(
      <BonDetailEditDialog bon={mockBon} open={true} onOpenChange={() => {}} onSaved={() => {}} />
    );

    expect(screen.getByRole("spinbutton", { name: "Klnr2" })).toHaveValue(0);
    expect(screen.getByRole("spinbutton", { name: "Klnr3" })).toHaveValue(0);
  });

  it("shows an aggregate numeric validation error and does not call the API", async () => {
    const user = userEvent.setup();
    render(
      <BonDetailEditDialog bon={mockBon} open={true} onOpenChange={() => {}} onSaved={() => {}} />
    );

    // Native <input type="number"> silently refuses to hold a
    // non-numeric string (both via userEvent keystrokes and via
    // fireEvent.change), so a truly invalid value can only be forced onto
    // the underlying DOM node by temporarily flipping it to type="text"
    // before dispatching the change - this still exercises the same
    // controlled React onChange -> Number.isNaN validation path.
    const klnr2Input = screen.getByRole("spinbutton", { name: "Klnr2" });
    klnr2Input.setAttribute("type", "text");
    fireEvent.change(klnr2Input, { target: { value: "not-a-number" } });

    await user.click(screen.getByRole("button", { name: "Opslaan" }));

    expect(
      await screen.findByText(
        "Alle numerieke velden (Klnr2, Klnr3, Recupel bedrag, A-bedrag) moeten geldige getallen zijn."
      )
    ).toBeInTheDocument();
    expect(updateBonMock).not.toHaveBeenCalled();
  });

  it("saves with exactly the 9-key payload and calls onSaved / closes on success", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    const onOpenChange = vi.fn();
    const updated: BonItem = { ...mockBon, klnr2: 42, lnaam: "Aflever BV" };
    updateBonMock.mockResolvedValue(updated);

    render(
      <BonDetailEditDialog
        bon={mockBon}
        open={true}
        onOpenChange={onOpenChange}
        onSaved={onSaved}
      />
    );

    const klnr2Input = screen.getByRole("spinbutton", { name: "Klnr2" });
    await user.clear(klnr2Input);
    await user.type(klnr2Input, "42");

    const lnaamInput = screen.getByRole("textbox", { name: "Naam" });
    await user.type(lnaamInput, "Aflever BV");

    await user.click(screen.getByRole("button", { name: "Opslaan" }));

    await waitFor(() => expect(updateBonMock).toHaveBeenCalledTimes(1));
    expect(updateBonMock).toHaveBeenCalledWith(1234567, {
      klnr2: 42,
      klnr3: 0,
      recupelBedrag: 0,
      aBedrag: 0,
      lnaam: "Aflever BV",
      lnaam1: "",
      ladres: "",
      lpostnr: "",
      lstad: "",
    });
    expect(onSaved).toHaveBeenCalledWith(updated);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows the backend error and keeps the dialog open on failure", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    updateBonMock.mockRejectedValue(new Error("Bon 1234567 not found"));

    render(
      <BonDetailEditDialog
        bon={mockBon}
        open={true}
        onOpenChange={onOpenChange}
        onSaved={() => {}}
      />
    );

    await user.click(screen.getByRole("button", { name: "Opslaan" }));

    expect(await screen.findByText("Bon 1234567 not found")).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });
});
