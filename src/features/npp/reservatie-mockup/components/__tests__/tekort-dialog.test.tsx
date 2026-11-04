import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TekortDialog } from "../tekort-dialog";
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

describe("TekortDialog", () => {
  it("calls onAanwezig(false) when 'Nee, niet aanwezig' is clicked", () => {
    const onAanwezig = vi.fn();
    render(
      <TekortDialog
        open
        onderdeel={onderdeel}
        onAanwezig={onAanwezig}
        onAnnuleer={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Nee, niet aanwezig" }));
    expect(onAanwezig).toHaveBeenCalledWith(false);
  });

  it("calls onAanwezig(true) when 'Ja, fysiek aanwezig' is clicked", () => {
    const onAanwezig = vi.fn();
    render(
      <TekortDialog
        open
        onderdeel={onderdeel}
        onAanwezig={onAanwezig}
        onAnnuleer={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Ja, fysiek aanwezig" }));
    expect(onAanwezig).toHaveBeenCalledWith(true);
  });

  it("calls onAnnuleer, not onAanwezig, when closed via Escape", () => {
    const onAanwezig = vi.fn();
    const onAnnuleer = vi.fn();
    render(
      <TekortDialog
        open
        onderdeel={onderdeel}
        onAanwezig={onAanwezig}
        onAnnuleer={onAnnuleer}
      />,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onAnnuleer).toHaveBeenCalled();
    expect(onAanwezig).not.toHaveBeenCalled();
  });
});
