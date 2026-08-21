import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OfferteCreatePage } from "../offerte-create-page";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const createOfferteMock = vi.fn();
vi.mock("@/lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-client")>("@/lib/api-client");
  return {
    ...actual,
    createOfferte: (...args: unknown[]) => createOfferteMock(...args),
  };
});

beforeEach(() => {
  pushMock.mockReset();
  createOfferteMock.mockReset();
});

describe("OfferteCreatePage", () => {
  it("renders the heading", () => {
    render(<OfferteCreatePage />);
    expect(screen.getByRole("heading", { name: "Nieuwe offerte" })).toBeInTheDocument();
  });

  it("rejects a missing klnr", async () => {
    const user = userEvent.setup();
    render(<OfferteCreatePage />);

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText("Klnr moet een geldig positief getal zijn.")
    ).toBeInTheDocument();
    expect(createOfferteMock).not.toHaveBeenCalled();
  });

  it("creates the offerte without offnr/versie in the payload and navigates to edit mode", async () => {
    const user = userEvent.setup();
    createOfferteMock.mockResolvedValue({ offnr: 999999, versie: 1 });

    render(<OfferteCreatePage />);

    await user.type(screen.getByRole("spinbutton", { name: "Klnr" }), "100");
    await user.type(screen.getByRole("textbox", { name: "Naam" }), "Test offerte");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(createOfferteMock).toHaveBeenCalledTimes(1));
    const [payload] = createOfferteMock.mock.calls[0];
    expect(payload).not.toHaveProperty("offnr");
    expect(payload).not.toHaveProperty("versie");
    expect(payload).toMatchObject({ klnr: 100, naam: "Test offerte" });
    expect(pushMock).toHaveBeenCalledWith("/offertes/999999/1/bewerken");
  });

  it("shows the error thrown by the API", async () => {
    const user = userEvent.setup();
    createOfferteMock.mockRejectedValue(new Error("Er ging iets mis."));

    render(<OfferteCreatePage />);

    await user.type(screen.getByRole("spinbutton", { name: "Klnr" }), "100");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Er ging iets mis.")).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("navigates back to the overview on cancel", async () => {
    const user = userEvent.setup();
    render(<OfferteCreatePage />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(pushMock).toHaveBeenCalledWith("/offertes/alle");
  });
});
