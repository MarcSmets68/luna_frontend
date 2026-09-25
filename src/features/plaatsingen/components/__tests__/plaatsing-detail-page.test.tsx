import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlaatsingDetailPage } from "../plaatsing-detail-page";
import type { PlaatsingItem } from "../../types";

const mockPlaatsing: PlaatsingItem = {
  planr: 24001,
  datum: "2026-03-04",
  klnr: 10423,
  klantNaam: "Interieur Van Damme bvba",
  vrtgw: "JVH",
  vrtgwNaam: "Jan Van Herck",
  project: 1042,
  bonnr: 219034,
  factuur: true,
  datumAfsluiting: "2026-04-18",
  naam: "Interieur Van Damme bvba",
  naam1: "",
  adres: "Steenweg op Gent 112",
  postnr: "9300",
  stad: "Aalst",
  land: "BE",
  lnaam: "Showroom Van Damme",
  lnaam1: "",
  ladres: "Nijverheidslaan 8",
  lpostnr: "9300",
  lstad: "Aalst",
  telefoon: "053/12.34.56",
  gsm: "0475/11.22.33",
  gsm2: "",
  email: "info@vandamme-interieur.be",
  email2: "",
  plaatsingswijze: "Aan uurloon",
  plaatsingsdatum: "2026-04-15",
  prijs: 480,
  locatie: "MAG1",
  swVoorbereiding: true,
  voorbereiding: "Stelling meebrengen.",
  swOpvolging: false,
  opvolging: "",
  opm: "Enkel bereikbaar in de voormiddag.",
  facturatie: "Factureren samen met orderbevestiging 219034.",
  klassementmap: "PLA-2024001",
  werkbonmap: "PLA-2024001\\werkbon",
};

describe("PlaatsingDetailPage", () => {
  it("renders the planr as heading", () => {
    render(<PlaatsingDetailPage plaatsing={mockPlaatsing} />);
    expect(screen.getByRole("heading", { name: "Plaatsing 24001" })).toBeInTheDocument();
  });

  it("shows the status badge as Afgesloten when datumAfsluiting is set", () => {
    render(<PlaatsingDetailPage plaatsing={mockPlaatsing} />);
    expect(screen.getByText("Afgesloten")).toBeInTheDocument();
  });

  it("shows the status badge as Open when datumAfsluiting is null", () => {
    render(<PlaatsingDetailPage plaatsing={{ ...mockPlaatsing, datumAfsluiting: null }} />);
    expect(screen.getByText("Open")).toBeInTheDocument();
  });

  it("renders both the factuuradres and the plaatsingsadres as separate sections", () => {
    render(<PlaatsingDetailPage plaatsing={mockPlaatsing} />);
    expect(screen.getByText("Adres")).toBeInTheDocument();
    expect(screen.getByText("Plaatsingsadres")).toBeInTheDocument();
    expect(screen.getByText("Steenweg op Gent 112")).toBeInTheDocument();
    expect(screen.getByText("Nijverheidslaan 8")).toBeInTheDocument();
  });

  it("renders contact fields", () => {
    render(<PlaatsingDetailPage plaatsing={mockPlaatsing} />);
    expect(screen.getByText("053/12.34.56")).toBeInTheDocument();
    expect(screen.getByText("info@vandamme-interieur.be")).toBeInTheDocument();
  });

  it("renders the plaatsingswijze, datum and prijs", () => {
    render(<PlaatsingDetailPage plaatsing={mockPlaatsing} />);
    expect(screen.getByText("Aan uurloon")).toBeInTheDocument();
    expect(screen.getByText("480,00")).toBeInTheDocument();
  });

  it("renders voorbereiding and opvolging notes", () => {
    render(<PlaatsingDetailPage plaatsing={mockPlaatsing} />);
    expect(screen.getByText("Stelling meebrengen.")).toBeInTheDocument();
    expect(screen.getByText("Voorbereiding (aangevinkt)")).toBeInTheDocument();
  });

  it("renders a back link to the plaatsingen overview", () => {
    render(<PlaatsingDetailPage plaatsing={mockPlaatsing} />);
    expect(screen.getByRole("link", { name: /Terug naar overzicht/ })).toHaveAttribute(
      "href",
      "/plaatsingen"
    );
  });
});
