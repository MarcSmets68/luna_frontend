import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AnnuleerBonDialog } from "../annuleer-bon-dialog";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

const annuleerBonMock = vi.fn();
vi.mock("@/lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-client")>("@/lib/api-client");
  return {
    ...actual,
    annuleerBon: (...args: unknown[]) => annuleerBonMock(...args),
  };
});

beforeEach(() => {
  annuleerBonMock.mockReset();
  refreshMock.mockReset();
});

describe("AnnuleerBonDialog", () => {
  it('shows a disabled button when stempel is "O"', () => {
    render(<AnnuleerBonDialog bonnr={1234567} stempel="O" />);
    expect(screen.getByRole("button", { name: "Annuleer order" })).toBeDisabled();
  });

  it('shows an enabled button when stempel is "V"', () => {
    render(<AnnuleerBonDialog bonnr={1234567} stempel="V" />);
    expect(screen.getByRole("button", { name: "Annuleer order" })).toBeEnabled();
  });

  it('shows an enabled button when stempel is "B"', () => {
    render(<AnnuleerBonDialog bonnr={1234567} stempel="B" />);
    expect(screen.getByRole("button", { name: "Annuleer order" })).toBeEnabled();
  });

  it("shows a disabled button for an empty/unknown stempel", () => {
    render(<AnnuleerBonDialog bonnr={1234567} stempel="" />);
    expect(screen.getByRole("button", { name: "Annuleer order" })).toBeDisabled();
  });

  it('shows a disabled button when stempel is "X" (unknown value)', () => {
    render(<AnnuleerBonDialog bonnr={1234567} stempel="X" />);
    expect(screen.getByRole("button", { name: "Annuleer order" })).toBeDisabled();
  });

  it("opens a confirmation dialog when clicked", async () => {
    const user = userEvent.setup();
    render(<AnnuleerBonDialog bonnr={1234567} stempel="V" />);

    await user.click(screen.getByRole("button", { name: "Annuleer order" }));

    expect(
      screen.getByText(
        "Weet je zeker dat je deze order wil annuleren? Dit wist de bedragen en geeft reservaties vrij."
      )
    ).toBeInTheDocument();
  });

  it("calls annuleerBon and refreshes on confirm", async () => {
    const user = userEvent.setup();
    annuleerBonMock.mockResolvedValue({
      bonnr: 1234567,
      stempel: "O",
      bedrag: 0,
      btw: 108.38,
      recupelBedrag: 0,
      aBedrag: 0,
    });

    render(<AnnuleerBonDialog bonnr={1234567} stempel="V" />);
    await user.click(screen.getByRole("button", { name: "Annuleer order" }));
    await user.click(screen.getByRole("button", { name: "Bevestigen" }));

    await waitFor(() => expect(annuleerBonMock).toHaveBeenCalledWith(1234567));
    expect(refreshMock).toHaveBeenCalled();
  });

  it("shows an error and stays open when the call fails", async () => {
    const user = userEvent.setup();
    annuleerBonMock.mockRejectedValue(new Error("Order 1234567 is al open"));

    render(<AnnuleerBonDialog bonnr={1234567} stempel="V" />);
    await user.click(screen.getByRole("button", { name: "Annuleer order" }));
    await user.click(screen.getByRole("button", { name: "Bevestigen" }));

    expect(await screen.findByText("Order 1234567 is al open")).toBeInTheDocument();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("closes without calling annuleerBon on cancel", async () => {
    const user = userEvent.setup();
    render(<AnnuleerBonDialog bonnr={1234567} stempel="V" />);

    await user.click(screen.getByRole("button", { name: "Annuleer order" }));
    await user.click(screen.getByRole("button", { name: "Annuleren" }));

    expect(annuleerBonMock).not.toHaveBeenCalled();
  });
}); 
