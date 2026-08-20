import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DeleteLeverancierDialog } from "../delete-leverancier-dialog";

const deleteLeverancierMock = vi.fn();
vi.mock("@/lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-client")>("@/lib/api-client");
  return {
    ...actual,
    deleteLeverancier: (...args: unknown[]) => deleteLeverancierMock(...args),
  };
});

beforeEach(() => {
  deleteLeverancierMock.mockReset();
});

describe("DeleteLeverancierDialog", () => {
  it("renders the confirmation text with naam and levnr", () => {
    render(
      <DeleteLeverancierDialog
        levnr={42}
        naam="ACME Leveringen"
        open={true}
        onOpenChange={() => {}}
        onDeleted={() => {}}
      />
    );
    expect(
      screen.getByText(
        "Leverancier ACME Leveringen (42) verwijderen? Dit kan niet ongedaan worden gemaakt."
      )
    ).toBeInTheDocument();
  });

  it("calls deleteLeverancier and onDeleted on confirm", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onDeleted = vi.fn();
    deleteLeverancierMock.mockResolvedValue({ status: "deleted", levnr: 42 });

    render(
      <DeleteLeverancierDialog
        levnr={42}
        naam="ACME Leveringen"
        open={true}
        onOpenChange={onOpenChange}
        onDeleted={onDeleted}
      />
    );

    await user.click(screen.getByRole("button", { name: "Ja, verwijderen" }));

    await waitFor(() => expect(deleteLeverancierMock).toHaveBeenCalledWith(42));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onDeleted).toHaveBeenCalled();
  });

  it("closes without calling deleteLeverancier on cancel", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onDeleted = vi.fn();

    render(
      <DeleteLeverancierDialog
        levnr={42}
        naam="ACME Leveringen"
        open={true}
        onOpenChange={onOpenChange}
        onDeleted={onDeleted}
      />
    );

    await user.click(screen.getByRole("button", { name: "Annuleren" }));

    expect(deleteLeverancierMock).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onDeleted).not.toHaveBeenCalled();
  });

  it("shows an error and stays open when the delete fails", async () => {
    const user = userEvent.setup();
    deleteLeverancierMock.mockRejectedValue(new Error("Leverancier 42 not found"));

    render(
      <DeleteLeverancierDialog
        levnr={42}
        naam="ACME Leveringen"
        open={true}
        onOpenChange={() => {}}
        onDeleted={() => {}}
      />
    );

    await user.click(screen.getByRole("button", { name: "Ja, verwijderen" }));

    expect(await screen.findByText("Leverancier 42 not found")).toBeInTheDocument();
  });
});
