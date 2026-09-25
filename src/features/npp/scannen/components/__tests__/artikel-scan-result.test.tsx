import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ArtikelScanResult } from "../artikel-scan-result";

describe("ArtikelScanResult", () => {
  it("renders the resolved article's fields", () => {
    render(
      <ArtikelScanResult
        article={{
          artnr: "ART-1",
          nummer: 1,
          xref: "XREF-1",
          omschrijving: "Profiel",
          barcode: "590123",
          pickingkode: "P1",
          pickingkleur: "Rood",
        }}
      />
    );

    expect(screen.getByText("ART-1")).toBeInTheDocument();
    expect(screen.getByText("XREF-1")).toBeInTheDocument();
    expect(screen.getByText("Profiel")).toBeInTheDocument();
    expect(screen.getByText("590123")).toBeInTheDocument();
    expect(screen.getByText("P1")).toBeInTheDocument();
    expect(screen.getByText("Rood")).toBeInTheDocument();
  });

  it("does not render Aantal when it's absent", () => {
    render(
      <ArtikelScanResult
        article={{
          artnr: "ART-1",
          nummer: 1,
          xref: "XREF-1",
          omschrijving: "Profiel",
          barcode: "590123",
          pickingkode: "P1",
          pickingkleur: "Rood",
        }}
      />
    );
    expect(screen.queryByText("Aantal")).not.toBeInTheDocument();
  });

  it("renders Aantal when present (nummer-aantal scan form)", () => {
    render(
      <ArtikelScanResult
        article={{
          artnr: "ART-1",
          nummer: 1,
          xref: "XREF-1",
          omschrijving: "Profiel",
          barcode: "590123",
          pickingkode: "P1",
          pickingkleur: "Rood",
          aantal: 4,
        }}
      />
    );
    expect(screen.getByText("Aantal")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });
});
