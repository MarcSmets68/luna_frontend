import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AantalPaneel } from "../aantal-paneel";
import type { MockOnderdeel } from "../../types";

const baseOnderdeel: MockOnderdeel = {
  id: "o1",
  artikelcode: "ART-1",
  omschrijving: "Test onderdeel",
  benodigd: 5,
  stock: 10,
  locatie: "A-01",
  uitstelbaar: false,
  status: "te_scannen",
};

describe("AantalPaneel", () => {
  it("does not go below 0 when decrementing", () => {
    const onAantalChange = vi.fn();
    render(
      <AantalPaneel
        onderdeel={baseOnderdeel}
        aantal={0}
        batch=""
        onAantalChange={onAantalChange}
        onBatchChange={vi.fn()}
        onBevestig={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Aantal verlagen" }));
    expect(onAantalChange).toHaveBeenCalledWith(0);
  });

  it("increments normally", () => {
    const onAantalChange = vi.fn();
    render(
      <AantalPaneel
        onderdeel={baseOnderdeel}
        aantal={3}
        batch=""
        onAantalChange={onAantalChange}
        onBatchChange={vi.fn()}
        onBevestig={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Aantal verhogen" }));
    expect(onAantalChange).toHaveBeenCalledWith(4);
  });

  it("does not show a batch/bin field for parts that are not lichtbron/driver", () => {
    render(
      <AantalPaneel
        onderdeel={baseOnderdeel}
        aantal={5}
        batch=""
        onAantalChange={vi.fn()}
        onBatchChange={vi.fn()}
        onBevestig={vi.fn()}
      />,
    );
    expect(screen.queryByLabelText("Batch / bin")).not.toBeInTheDocument();
  });

  it("shows a prefilled batch/bin field for lichtbron/driver parts and reports edits", () => {
    const onBatchChange = vi.fn();
    render(
      <AantalPaneel
        onderdeel={{ ...baseOnderdeel, isLichtbronOfDriver: true }}
        aantal={5}
        batch="DRV-2026-11"
        onAantalChange={vi.fn()}
        onBatchChange={onBatchChange}
        onBevestig={vi.fn()}
      />,
    );
    const batchInput = screen.getByLabelText("Batch / bin") as HTMLInputElement;
    expect(batchInput.value).toBe("DRV-2026-11");
    fireEvent.change(batchInput, { target: { value: "BIN-9" } });
    expect(onBatchChange).toHaveBeenCalledWith("BIN-9");
  });
});
