import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LeverancierCreatePage } from "../leverancier-create-page";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const createLeverancierMock = vi.fn();
vi.mock("@/lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-client")>("@/lib/api-client");
  return {
    ...actual,
    createLeverancier: (...args: unknown[]) => createLeverancierMock(...args),
  };
});

beforeEach(() => {
  pushMock.mockReset();
  createLeverancierMock.mockReset();
});

describe("LeverancierCreatePage", () => {
  it("renders the heading", () => {
    render(<LeverancierCreatePage />);
    expect(screen.getByRole("heading", { name: "Nieuwe leverancier" })).toBeInTheDocument();
  });

  it("renders a BTW-regime input", () => {
    render(<LeverancierCreatePage />);
    expect(screen.getByRole("spinbutton", { name: "BTW-regime" })).toBeInTheDocument();
  });

  it("does not render a Levnr input - it is generated server-side", () => {
    render(<LeverancierCreatePage />);
    expect(screen.queryByRole("spinbutton", { name: "Levnr" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Levnr")).not.toBeInTheDocument();
  });

  it("creates the leverancier and navigates to its detail page using the server-returned levnr", async () => {
    const user = userEvent.setup();
    createLeverancierMock.mockResolvedValue({ levnr: 777, naam: "Nieuwe Leverancier" });

    render(<LeverancierCreatePage />);

    await user.type(screen.getByRole("textbox", { name: "Naam" }), "Nieuwe Leverancier");
    await user.type(screen.getByRole("spinbutton", { name: "BTW-regime" }), "3");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(createLeverancierMock).toHaveBeenCalledTimes(1));
    const payload = createLeverancierMock.mock.calls[0][0];
    expect(payload).not.toHaveProperty("levnr");
    expect(payload).toEqual(
      expect.objectContaining({ naam: "Nieuwe Leverancier", btwRegime: 3 })
    );
    expect(pushMock).toHaveBeenCalledWith("/leveranciers/777");
  });

  it("defaults btwRegime to 0 when left blank", async () => {
    const user = userEvent.setup();
    createLeverancierMock.mockResolvedValue({ levnr: 778, naam: "Nieuwe Leverancier" });

    render(<LeverancierCreatePage />);

    await user.type(screen.getByRole("textbox", { name: "Naam" }), "Nieuwe Leverancier");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(createLeverancierMock).toHaveBeenCalledTimes(1));
    const payload = createLeverancierMock.mock.calls[0][0];
    expect(payload.btwRegime).toBe(0);
  });

  it("shows an error and does not call the API when BTW-regime is not a valid number", async () => {
    const user = userEvent.setup();
    render(<LeverancierCreatePage />);

    const btwRegimeInput = screen.getByRole("spinbutton", { name: "BTW-regime" });
    // type="number" inputs sanitize non-numeric keystrokes at the DOM level
    // (like a real browser), so the invalid string is injected by switching
    // to "text" first - this exercises the same onChange/state path with a
    // value a browser autofill/paste could still deliver as a raw string.
    btwRegimeInput.setAttribute("type", "text");
    fireEvent.change(btwRegimeInput, { target: { value: "abc" } });

    await user.type(screen.getByRole("textbox", { name: "Naam" }), "Nieuwe Leverancier");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText("BTW-regime moet een geldig getal zijn.")
    ).toBeInTheDocument();
    expect(createLeverancierMock).not.toHaveBeenCalled();
  });

  it("shows the error thrown by the API", async () => {
    const user = userEvent.setup();
    createLeverancierMock.mockRejectedValue(new Error("Er ging iets mis."));

    render(<LeverancierCreatePage />);

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Er ging iets mis.")).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("navigates back to the overview on cancel", async () => {
    const user = userEvent.setup();
    render(<LeverancierCreatePage />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(pushMock).toHaveBeenCalledWith("/leveranciers");
  });
});
