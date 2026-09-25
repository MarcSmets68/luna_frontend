import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BoxHeader } from "../box-header";
import type { BoxOverzichtResult } from "../../types";

const baseResult: BoxOverzichtResult = {
  bonnr: 12345,
  groepnr: 1,
  klant: "CONE LIGHTING BV",
  opmerking: "niets",
  empty: false,
  articles: [],
};

describe("BoxHeader", () => {
  it("renders bonnr, groepnr and klant", () => {
    render(<BoxHeader result={baseResult} />);
    expect(screen.getByText(/Bon 12345/)).toBeInTheDocument();
    expect(screen.getByText(/Groep 1/)).toBeInTheDocument();
    expect(screen.getByText("CONE LIGHTING BV")).toBeInTheDocument();
  });

  it("renders the literal opmerking value \"niets\" as-is, not as a special case", () => {
    render(<BoxHeader result={baseResult} />);
    expect(screen.getByText("Opmerking: niets")).toBeInTheDocument();
  });

  it("renders a different opmerking value as-is too", () => {
    render(<BoxHeader result={{ ...baseResult, opmerking: "Fragiel - voorzichtig behandelen" }} />);
    expect(screen.getByText("Opmerking: Fragiel - voorzichtig behandelen")).toBeInTheDocument();
  });
});
