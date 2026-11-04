import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TellenDialog } from "../tellen-dialog";
import type { MockOnderdeel } from "../../types";

const onderdeel: MockOnderdeel = {
  id: "o1",
  artikelcode: "ART-1",
  omschrijving: "Test onderdeel",
  benodigd: 10,
  stock: 3,
  locatie: "A-01",
  uitstelbaar: false,
  status: "te_scannen",
};

describe("TellenDialog", () => {
  it("keeps 'Opslaan' disabled until both a count and a reden are filled in", async () => {
    const user = userEvent.setup();
    render(
      <TellenDialog
        open
        onderdeel={onderdeel}
        onBevestig={vi.fn()}
        onAnnuleer={vi.fn()}
      />,
    );
    const opslaan = screen.getByRole("button", { name: "Opslaan" });
    expect(opslaan).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Werkelijk geteld aantal"), {
      target: { value: "10" },
    });
    expect(opslaan).toBeDisabled(); // reden still missing

    await user.click(screen.getByRole("combobox", { name: "Reden" }));
    await user.click(screen.getByRole("option", { name: "Verkeerde locatie" }));
    expect(opslaan).not.toBeDisabled();
  });

  it("calls onBevestig with the count and reden once enabled", async () => {
    const user = userEvent.setup();
    const onBevestig = vi.fn();
    render(
      <TellenDialog
        open
        onderdeel={onderdeel}
        onBevestig={onBevestig}
        onAnnuleer={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText("Werkelijk geteld aantal"), {
      target: { value: "10" },
    });
    await user.click(screen.getByRole("combobox", { name: "Reden" }));
    await user.click(screen.getByRole("option", { name: "Verkeerde locatie" }));
    fireEvent.click(screen.getByRole("button", { name: "Opslaan" }));
    expect(onBevestig).toHaveBeenCalledWith(10, "verkeerde_locatie", undefined);
  });
});
