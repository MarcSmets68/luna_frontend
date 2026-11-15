import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VerkoopsanalyseView } from "../verkoopsanalyse-results";
import { maanden, response, rij } from "../../test-utils/fixtures";

describe("VerkoopsanalyseView", () => {
  it("shows the period, the yearly totals with growth and the month table", () => {
    render(<VerkoopsanalyseView response={response()} gekozenDealers={1} />);

    expect(screen.getByText("01/11/2025 t/m 31/10/2026")).toBeInTheDocument();
    expect(screen.getByText("Dealer Antwerpen")).toBeInTheDocument();
    expect(screen.getByText("Omzet afgelopen 12 maanden")).toBeInTheDocument();
    expect(screen.getAllByText(/1\.200,00/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^\+25,0\s%$/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/nov 2025/)[0]).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /PDF/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /CSV/ })).toBeInTheDocument();
    // One article: no separate per-article section.
    expect(screen.queryByRole("heading", { name: "Per artikel" })).not.toBeInTheDocument();
  });

  it("lists every article and hides the summed aantal when units are mixed", () => {
    render(
      <VerkoopsanalyseView
        response={response({ rijen: [rij({ eenheid: "m" }), rij({ artnr: "NOMA", swBegins: true, omschrijving: null })] })}
        gekozenDealers={0}
      />,
    );

    expect(screen.getByRole("heading", { name: "Per artikel" })).toBeInTheDocument();
    expect(screen.getByText("NOMA… (groep)")).toBeInTheDocument();
    expect(screen.getByText(/verschillende eenheden/)).toBeInTheDocument();
    expect(screen.getByText("Alle Nomaled-dealers (1)")).toBeInTheDocument();
  });

  it("shows an empty state without export buttons when nothing was sold", () => {
    const leeg = rij({ maanden: maanden(() => ({ aantal: 0, omzet: 0, aantalVorigJaar: 0, omzetVorigJaar: 0 })) });
    render(<VerkoopsanalyseView response={response({ rijen: [leeg] })} gekozenDealers={1} />);

    expect(screen.getByText(/Geen verkoop gevonden/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /PDF/ })).not.toBeInTheDocument();
  });
});
