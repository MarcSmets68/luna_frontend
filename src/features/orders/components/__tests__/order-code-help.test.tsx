import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OrderCodeHelp } from "../order-code-help";
import { getBonTypeLabel, getStempelLabel } from "../../lib/bon-stempel";

describe("order code explanations", () => {
  it("translates documented document types and retains unknown type codes", () => {
    expect(getBonTypeLabel("ORDERBEVESTIGING")).toBe("Orderbevestiging");
    expect(getBonTypeLabel("HERSTELLING")).toBe("Herstelling");
    expect(getBonTypeLabel("B")).toBe("B (typecode)");
    expect(getBonTypeLabel("X")).toBe("X (typecode)");
    expect(getBonTypeLabel("")).toBe("Onbekend");
    expect(getBonTypeLabel("constructor")).toBe("constructor (typecode)");
  });

  it("does not confuse a document type with the separately defined status", () => {
    expect(getStempelLabel("B")).toBe("Besteld");
    expect(getBonTypeLabel("B")).not.toBe("Besteld");
    expect(getStempelLabel("constructor")).toBe("constructor");
    render(<OrderCodeHelp />);
    expect(screen.getByText("Uitleg bij ordercodes").tagName).toBe("SUMMARY");
    expect(screen.getByText(/Voor andere typecodes, zoals B, is geen omschrijving beschikbaar/)).toBeInTheDocument();
    expect(screen.getByText("De typecode B heeft hier geen omschrijving. Status B wordt als Besteld weergegeven.")).toBeInTheDocument();
    expect(screen.getByText("Stempel")).toBeInTheDocument();
    for (const status of ["Open", "In verwerking", "Besteld", "Afgeleverd"]) {
      expect(screen.getByText(new RegExp(`— ${status}$`))).toBeInTheDocument();
    }
  });
});
