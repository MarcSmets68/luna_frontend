import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { StockbewegingConfirmDialog } from "../stockbeweging-confirm-dialog";
import type { ArtikelScanArticle } from "../../types";

const article: ArtikelScanArticle = {
  artnr: "ART-1",
  nummer: 1,
  xref: "XREF-1",
  omschrijving: "Profiel",
  barcode: "590123",
  pickingkode: "P1",
  pickingkleur: "Rood",
};

describe("StockbewegingConfirmDialog", () => {
  it("shows the summary of artnr, omschrijving, type and aantal/opm", () => {
    render(
      <StockbewegingConfirmDialog
        open={true}
        article={article}
        movementType="ontvangst"
        aantal="5"
        opm="Ontvangst levering"
        nieuwMagazijn=""
        submitting={false}
        error={null}
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByText("ART-1")).toBeInTheDocument();
    expect(screen.getByText("Profiel")).toBeInTheDocument();
    expect(screen.getByText("Ontvangst")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("Ontvangst levering")).toBeInTheDocument();
  });

  it("shows nieuwMagazijn instead of aantal/opm for transfer_intern", () => {
    render(
      <StockbewegingConfirmDialog
        open={true}
        article={article}
        movementType="transfer_intern"
        aantal=""
        opm=""
        nieuwMagazijn="M2"
        submitting={false}
        error={null}
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByText("Transfer intern")).toBeInTheDocument();
    expect(screen.getByText("M2")).toBeInTheDocument();
    expect(screen.queryByText("Opmerking")).not.toBeInTheDocument();
  });

  it("calls onConfirm when Bevestigen is clicked and onCancel when Annuleren is clicked", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <StockbewegingConfirmDialog
        open={true}
        article={article}
        movementType="ontvangst"
        aantal="5"
        opm="Ontvangst levering"
        nieuwMagazijn=""
        submitting={false}
        error={null}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    await user.click(screen.getByRole("button", { name: "Bevestigen" }));
    expect(onConfirm).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Annuleren" }));
    expect(onCancel).toHaveBeenCalled();
  });

  it("renders the error message verbatim next to the summary when present", () => {
    render(
      <StockbewegingConfirmDialog
        open={true}
        article={article}
        movementType="ontvangst"
        aantal="5"
        opm="Ontvangst levering"
        nieuwMagazijn=""
        submitting={false}
        error="Onvoldoende voorraad voor deze boeking (huidige voorraad: 3)"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Onvoldoende voorraad voor deze boeking (huidige voorraad: 3)"
    );
  });

  it("disables both buttons while submitting", () => {
    render(
      <StockbewegingConfirmDialog
        open={true}
        article={article}
        movementType="ontvangst"
        aantal="5"
        opm="Ontvangst levering"
        nieuwMagazijn=""
        submitting={true}
        error={null}
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByRole("button", { name: "Annuleren" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Bezig..." })).toBeDisabled();
  });
});
