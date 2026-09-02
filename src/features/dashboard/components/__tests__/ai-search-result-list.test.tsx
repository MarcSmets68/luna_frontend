import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AiSearchResultList } from "../ai-search-result-list";

describe("AiSearchResultList", () => {
  it("renders nothing when there are no items", () => {
    const { container } = render(<AiSearchResultList items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a column per key of the first item, using the raw field names as headers", () => {
    render(
      <AiSearchResultList
        items={[
          { offnr: 2167769, naam: "CONE LIGHTING BV", verkocht: true },
          { offnr: 2167770, naam: "Meufalux bvba", verkocht: false },
        ]}
      />
    );

    expect(screen.getByRole("columnheader", { name: "offnr" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "naam" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "verkocht" })).toBeInTheDocument();
    expect(screen.getByText("2167769")).toBeInTheDocument();
    expect(screen.getByText("CONE LIGHTING BV")).toBeInTheDocument();
    expect(screen.getByText("Ja")).toBeInTheDocument();
    expect(screen.getByText("Nee")).toBeInTheDocument();
  });

  it("renders a dash for null/undefined values instead of the literal text", () => {
    render(<AiSearchResultList items={[{ artnr: "ABC123", opm: null }]} />);
    expect(screen.getByText("-")).toBeInTheDocument();
  });
});
