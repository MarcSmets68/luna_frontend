import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AnnuleerBonDialog } from "../annuleer-bon-dialog";
import { ApiError, type BonItem } from "@/lib/api-client";

const annuleerBonMock = vi.fn();
vi.mock("@/lib/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api-client")>();
  return {
    ...actual,
    annuleerBon: (...args: unknown[]) => annuleerBonMock(...args),
  };
});

const onCancelled = vi.fn();
const onConflict = vi.fn();

beforeEach(() => {
  annuleerBonMock.mockReset();
  onCancelled.mockReset();
  onConflict.mockReset();
});

function setup(stempel = "V", extra: { disabled?: boolean } = {}) {
  return render(
    <AnnuleerBonDialog
      bonnr={1234567}
      klantNaam="CONE LIGHTING BV"
      stempel={stempel}
      onCancelled={onCancelled}
      onConflict={onConflict}
      {...extra}
    />
  );
}

const trigger = () => screen.getByRole("button", { name: "Annuleer order" });

async function openDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(trigger());
  return screen.findByRole("dialog");
}

function confirmButton() {
  const dialog = screen.getByRole("dialog");
  return Array.from(dialog.querySelectorAll("button")).find(
    (b) => b.textContent === "Order annuleren" || b.textContent === "Bezig..."
  ) as HTMLButtonElement;
}

describe("AnnuleerBonDialog", () => {
  it.each(["O", "D", "", "X"])("disables the trigger for stempel %j", (s) => {
    setup(s);
    expect(trigger()).toBeDisabled();
  });

  it.each(["V", "B"])("enables the trigger for stempel %s", (s) => {
    setup(s);
    expect(trigger()).toBeEnabled();
  });

  it("gives a stempel-specific title on the disabled trigger", () => {
    const { unmount } = setup("D");
    const titleD = trigger().getAttribute("title");
    unmount();
    setup("O");
    const titleO = trigger().getAttribute("title");
    expect(titleD).toBeTruthy();
    expect(titleO).toBeTruthy();
    expect(titleD).not.toBe(titleO);
  });

  it("disables the trigger when disabled={true} even for V", () => {
    setup("V", { disabled: true });
    expect(trigger()).toBeDisabled();
  });

  it("opens the dialog without calling the API and shows the consequences", async () => {
    const user = userEvent.setup();
    setup();
    await openDialog(user);
    expect(screen.getByText("Order annuleren", { selector: "h2, [data-slot='dialog-title']" })).toBeInTheDocument();
    expect(screen.getByText(/Bon 1234567 — CONE LIGHTING BV/)).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    expect(screen.getByText(/De btw blijft behouden/)).toBeInTheDocument();
    expect(screen.getByText(/niet ongedaan/)).toBeInTheDocument();
    expect(annuleerBonMock).not.toHaveBeenCalled();
  });

  it("closes on Terug without calling the API", async () => {
    const user = userEvent.setup();
    setup();
    await openDialog(user);
    await user.click(screen.getByRole("button", { name: "Terug" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(annuleerBonMock).not.toHaveBeenCalled();
  });

  it("cancels the order, closes and reports the response", async () => {
    const user = userEvent.setup();
    const response = { bonnr: 1234567, stempel: "O" } as BonItem;
    annuleerBonMock.mockResolvedValue(response);
    setup();
    await openDialog(user);
    await user.click(confirmButton());
    await waitFor(() => expect(annuleerBonMock).toHaveBeenCalledWith(1234567));
    await waitFor(() => expect(onCancelled).toHaveBeenCalledWith(response));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("is busy during the call: buttons disabled and ESC does not close", async () => {
    const user = userEvent.setup();
    let resolve!: (b: BonItem) => void;
    annuleerBonMock.mockReturnValue(new Promise<BonItem>((r) => (resolve = r)));
    setup();
    await openDialog(user);
    await user.click(confirmButton());
    expect(await screen.findByRole("button", { name: "Bezig..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Terug" })).toBeDisabled();
    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    resolve({ bonnr: 1234567, stempel: "O" } as BonItem);
    await waitFor(() => expect(onCancelled).toHaveBeenCalled());
  });

  it("shows the 409 message with detail, stays open and calls onConflict", async () => {
    const user = userEvent.setup();
    annuleerBonMock.mockRejectedValue(new ApiError(409, "msg", "backend msg"));
    setup();
    await openDialog(user);
    await user.click(confirmButton());
    expect(
      await screen.findByText("De status van deze order is intussen gewijzigd; ververs de pagina.")
    ).toBeInTheDocument();
    expect(screen.getByText("backend msg")).toBeInTheDocument();
    expect(onConflict).toHaveBeenCalledTimes(1);
    expect(onCancelled).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows 'Order niet gevonden.' for 404", async () => {
    const user = userEvent.setup();
    annuleerBonMock.mockRejectedValue(new ApiError(404, "msg", "bon weg"));
    setup();
    await openDialog(user);
    await user.click(confirmButton());
    expect(await screen.findByText("Order niet gevonden.")).toBeInTheDocument();
    expect(screen.getByText("bon weg")).toBeInTheDocument();
    expect(onConflict).not.toHaveBeenCalled();
  });

  it("shows a generic message for 500 and network errors", async () => {
    const user = userEvent.setup();
    annuleerBonMock.mockRejectedValueOnce(new ApiError(500, "msg", "boom"));
    setup();
    await openDialog(user);
    await user.click(confirmButton());
    expect(
      await screen.findByText("Er ging iets mis bij het annuleren van de order.")
    ).toBeInTheDocument();
    expect(screen.getByText("boom")).toBeInTheDocument();

    annuleerBonMock.mockRejectedValueOnce(new Error("Failed to fetch"));
    await user.click(confirmButton());
    expect(await screen.findByText("Failed to fetch")).toBeInTheDocument();
  });

  it("allows retrying after an error", async () => {
    const user = userEvent.setup();
    annuleerBonMock.mockRejectedValueOnce(new Error("netwerk"));
    annuleerBonMock.mockResolvedValueOnce({ bonnr: 1234567, stempel: "O" });
    setup();
    await openDialog(user);
    await user.click(confirmButton());
    await screen.findByRole("alert");
    await user.click(confirmButton());
    await waitFor(() => expect(onCancelled).toHaveBeenCalledTimes(1));
    expect(annuleerBonMock).toHaveBeenCalledTimes(2);
  });

  it("clears the error after closing and reopening", async () => {
    const user = userEvent.setup();
    annuleerBonMock.mockRejectedValue(new Error("netwerk"));
    setup();
    await openDialog(user);
    await user.click(confirmButton());
    await screen.findByRole("alert");
    await user.click(screen.getByRole("button", { name: "Terug" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await openDialog(user);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("keeps the error visible when the stempel prop turns O while open", async () => {
    const user = userEvent.setup();
    annuleerBonMock.mockRejectedValue(new ApiError(409, "msg"));
    const { rerender } = setup();
    await openDialog(user);
    await user.click(confirmButton());
    await screen.findByRole("alert");
    rerender(
      <AnnuleerBonDialog
        bonnr={1234567}
        klantNaam="CONE LIGHTING BV"
        stempel="O"
        onCancelled={onCancelled}
        onConflict={onConflict}
      />
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(confirmButton()).toBeDisabled();
  });
});
