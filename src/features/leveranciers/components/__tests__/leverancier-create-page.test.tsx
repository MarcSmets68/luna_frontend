import { render, screen, waitFor } from "@testing-library/react";
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

  it("rejects a missing/non-numeric levnr", async () => {
    const user = userEvent.setup();
    render(<LeverancierCreatePage />);

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Levnr moet een geldig positief getal zijn.")).toBeInTheDocument();
    expect(createLeverancierMock).not.toHaveBeenCalled();
  });

  it("rejects a non-positive levnr", async () => {
    const user = userEvent.setup();
    render(<LeverancierCreatePage />);

    await user.type(screen.getByRole("spinbutton", { name: "Levnr" }), "-5");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Levnr moet een geldig positief getal zijn.")).toBeInTheDocument();
    expect(createLeverancierMock).not.toHaveBeenCalled();
  });

  it("creates the leverancier and navigates to its detail page on success", async () => {
    const user = userEvent.setup();
    createLeverancierMock.mockResolvedValue({ levnr: 777, naam: "Nieuwe Leverancier" });

    render(<LeverancierCreatePage />);

    await user.type(screen.getByRole("spinbutton", { name: "Levnr" }), "777");
    await user.type(screen.getByRole("textbox", { name: "Naam" }), "Nieuwe Leverancier");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(createLeverancierMock).toHaveBeenCalledTimes(1));
    expect(createLeverancierMock).toHaveBeenCalledWith(
      expect.objectContaining({ levnr: 777, naam: "Nieuwe Leverancier" })
    );
    expect(pushMock).toHaveBeenCalledWith("/leveranciers/777");
  });

  it("shows the error thrown by the API (e.g. duplicate levnr)", async () => {
    const user = userEvent.setup();
    createLeverancierMock.mockRejectedValue(new Error("Leverancier 777 bestaat al."));

    render(<LeverancierCreatePage />);

    await user.type(screen.getByRole("spinbutton", { name: "Levnr" }), "777");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Leverancier 777 bestaat al.")).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("navigates back to the overview on cancel", async () => {
    const user = userEvent.setup();
    render(<LeverancierCreatePage />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(pushMock).toHaveBeenCalledWith("/leveranciers");
  });
});
