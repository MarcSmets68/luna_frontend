import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { VoorraadPage } from "../voorraad-page";
import type { ArtikelItem } from "@/lib/api-client";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const mockItems: ArtikelItem[] = [
  {
    artnr: "AB123",
    omschrijvingNl: "Testartikel",
    omschrijvingFr: "Article de test",
    merk: "MERK",
    groep: "GRP1",
    barcode: "1234567890123",
    munt: "EUR",
    btwKode: "1",
    aankoopprijs: 10,
    verkoopprijs: 15.5,
    verkoopprijsIncl: 18.76,
    voorraad: 42,
    voorraadMin: 5,
    voorraadMax: 100,
    stock: true,
    geblokkeerd: false,
    leverancierNr: 1,
    gewicht: 1.2,
    type: "STD",
    datum: "2026-01-01",
  },
];

describe("VoorraadPage", () => {
  it("renders the page heading", () => {
    render(<VoorraadPage items={mockItems} page={1} hasMore={false} />);
    expect(screen.getByRole("heading", { name: "Artikelen" })).toBeInTheDocument();
  });

  it("renders every item's artnr and omschrijving", () => {
    render(<VoorraadPage items={mockItems} page={1} hasMore={false} />);
    for (const item of mockItems) {
      expect(screen.getByText(item.artnr)).toBeInTheDocument();
      expect(screen.getByText(item.omschrijvingNl)).toBeInTheDocument();
    }
  });

  it("shows an empty state when there are no items", () => {
    render(<VoorraadPage items={[]} page={1} hasMore={false} />);
    expect(screen.getByText("Geen artikelen gevonden.")).toBeInTheDocument();
  });

  it("shows a disabled 'Vorige' link on the first page and an enabled 'Volgende' link when there is more data", () => {
    render(<VoorraadPage items={mockItems} page={1} hasMore={true} />);
    expect(screen.queryByRole("link", { name: /vorige/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /volgende/i })).toHaveAttribute("href", "/voorraad?page=2");
  });

  it("shows an enabled 'Vorige' link on subsequent pages", () => {
    render(<VoorraadPage items={mockItems} page={2} hasMore={false} />);
    expect(screen.getByRole("link", { name: /vorige/i })).toHaveAttribute("href", "/voorraad?page=1");
    expect(screen.queryByRole("link", { name: /volgende/i })).not.toBeInTheDocument();
  });

  it("renders the plain heading and no 'Filter wissen' link when lageVoorraad is omitted", () => {
    render(<VoorraadPage items={mockItems} page={1} hasMore={false} />);
    expect(screen.getByRole("heading", { name: "Artikelen" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /filter wissen/i })).not.toBeInTheDocument();
  });

  it("renders the filtered heading and a 'Filter wissen' link when lageVoorraad is true", () => {
    render(<VoorraadPage items={mockItems} page={1} hasMore={false} lageVoorraad={true} />);
    expect(screen.getByRole("heading", { name: "Artikelen — Lage voorraad" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /filter wissen/i })).toHaveAttribute("href", "/voorraad");
  });

  it("preserves the lageVoorraad filter in the Vorige/Volgende hrefs", () => {
    render(<VoorraadPage items={mockItems} page={2} hasMore={true} lageVoorraad={true} />);
    expect(screen.getByRole("link", { name: /vorige/i })).toHaveAttribute(
      "href",
      "/voorraad?page=1&lageVoorraad=true"
    );
    expect(screen.getByRole("link", { name: /volgende/i })).toHaveAttribute(
      "href",
      "/voorraad?page=3&lageVoorraad=true"
    );
  });

  it("shows both the empty state and the filtered heading/clear link when items is empty and lageVoorraad is true", () => {
    render(<VoorraadPage items={[]} page={1} hasMore={false} lageVoorraad={true} />);
    expect(screen.getByText("Geen artikelen gevonden.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Artikelen — Lage voorraad" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /filter wissen/i })).toHaveAttribute("href", "/voorraad");
  });

  it("renders the 'Ook geblokkeerde artikelen tonen' filter unchecked by default", () => {
    render(<VoorraadPage items={mockItems} page={1} hasMore={false} />);
    expect(
      screen.getByRole("checkbox", { name: /ook geblokkeerde artikelen tonen/i })
    ).not.toBeChecked();
  });

  it("renders the 'Ook geblokkeerde artikelen tonen' filter checked when toonGeblokkeerd is true", () => {
    render(<VoorraadPage items={mockItems} page={1} hasMore={false} toonGeblokkeerd={true} />);
    expect(
      screen.getByRole("checkbox", { name: /ook geblokkeerde artikelen tonen/i })
    ).toBeChecked();
  });

  it("navigates to /voorraad?toonGeblokkeerd=true when the filter is checked", async () => {
    const user = userEvent.setup();
    render(<VoorraadPage items={mockItems} page={1} hasMore={false} />);
    await user.click(screen.getByRole("checkbox", { name: /ook geblokkeerde artikelen tonen/i }));
    expect(pushMock).toHaveBeenCalledWith("/voorraad?toonGeblokkeerd=true");
  });

  it("navigates back to /voorraad when the checked filter is unchecked", async () => {
    const user = userEvent.setup();
    render(<VoorraadPage items={mockItems} page={1} hasMore={false} toonGeblokkeerd={true} />);
    await user.click(screen.getByRole("checkbox", { name: /ook geblokkeerde artikelen tonen/i }));
    expect(pushMock).toHaveBeenCalledWith("/voorraad");
  });

  it("preserves the lageVoorraad filter when toggling toonGeblokkeerd", async () => {
    const user = userEvent.setup();
    render(<VoorraadPage items={mockItems} page={1} hasMore={false} lageVoorraad={true} />);
    await user.click(screen.getByRole("checkbox", { name: /ook geblokkeerde artikelen tonen/i }));
    expect(pushMock).toHaveBeenCalledWith("/voorraad?lageVoorraad=true&toonGeblokkeerd=true");
  });

  it("preserves the toonGeblokkeerd filter in the Vorige/Volgende hrefs", () => {
    render(<VoorraadPage items={mockItems} page={2} hasMore={true} toonGeblokkeerd={true} />);
    expect(screen.getByRole("link", { name: /vorige/i })).toHaveAttribute(
      "href",
      "/voorraad?page=1&toonGeblokkeerd=true"
    );
    expect(screen.getByRole("link", { name: /volgende/i })).toHaveAttribute(
      "href",
      "/voorraad?page=3&toonGeblokkeerd=true"
    );
  });

  it("navigates to the artikel detail page when a row is clicked", () => {
    pushMock.mockClear();
    render(<VoorraadPage items={mockItems} page={1} hasMore={false} />);
    const row = screen.getByRole("link", { name: /open artikel ab123/i });
    row.click();
    expect(pushMock).toHaveBeenCalledWith("/voorraad/AB123");
  });

  it("navigates to the artikel detail page when Enter is pressed on a focused row", () => {
    pushMock.mockClear();
    render(<VoorraadPage items={mockItems} page={1} hasMore={false} />);
    const row = screen.getByRole("link", { name: /open artikel ab123/i });
    row.focus();
    row.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
    expect(pushMock).toHaveBeenCalledWith("/voorraad/AB123");
  });
});
