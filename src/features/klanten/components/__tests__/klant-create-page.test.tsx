import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { KlantCreatePage } from "../klant-create-page";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const createKlantMock = vi.fn();
vi.mock("@/lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-client")>("@/lib/api-client");
  return {
    ...actual,
    createKlant: (...args: unknown[]) => createKlantMock(...args),
  };
});

beforeEach(() => {
  pushMock.mockReset();
  createKlantMock.mockReset();
});

describe("KlantCreatePage", () => {
  it("renders the heading", () => {
    render(<KlantCreatePage />);
    expect(screen.getByRole("heading", { name: "Nieuwe klant" })).toBeInTheDocument();
  });

  it("rejects a missing/non-numeric klnr", async () => {
    const user = userEvent.setup();
    render(<KlantCreatePage />);

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Klantnr moet een geldig positief getal zijn.")).toBeInTheDocument();
    expect(createKlantMock).not.toHaveBeenCalled();
  });

  it("creates the klant and navigates to its detail page on success", async () => {
    const user = userEvent.setup();
    createKlantMock.mockResolvedValue({ klnr: 777, naam: "Nieuwe Klant" });

    render(<KlantCreatePage />);

    await user.type(screen.getByRole("spinbutton", { name: "Klantnr" }), "777");
    await user.type(screen.getByRole("textbox", { name: "Naam" }), "Nieuwe Klant");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(createKlantMock).toHaveBeenCalledTimes(1));
    expect(createKlantMock).toHaveBeenCalledWith(
      expect.objectContaining({ klnr: 777, naam: "Nieuwe Klant" })
    );
    expect(pushMock).toHaveBeenCalledWith("/klanten/777");
  });

  it("shows the error thrown by the API (e.g. duplicate klnr)", async () => {
    const user = userEvent.setup();
    createKlantMock.mockRejectedValue(new Error("Klant 777 bestaat al."));

    render(<KlantCreatePage />);

    await user.type(screen.getByRole("spinbutton", { name: "Klantnr" }), "777");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Klant 777 bestaat al.")).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("navigates back to the overview on cancel", async () => {
    const user = userEvent.setup();
    render(<KlantCreatePage />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(pushMock).toHaveBeenCalledWith("/klanten");
  });
});
