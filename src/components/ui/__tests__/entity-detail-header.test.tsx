import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EntityDetailHeader } from "../entity-detail-header";

describe("EntityDetailHeader", () => {
  it("renders the title as a heading", () => {
    render(<EntityDetailHeader title="CONE LIGHTING BV" />);
    expect(screen.getByRole("heading", { name: "CONE LIGHTING BV" })).toBeInTheDocument();
  });

  it("renders the subtitle", () => {
    render(<EntityDetailHeader title="CONE LIGHTING BV" subtitle="Klantnr 14644" />);
    expect(screen.getByText("Klantnr 14644")).toBeInTheDocument();
  });

  it("renders badges", () => {
    render(<EntityDetailHeader title="CONE LIGHTING BV" badges={["VIP", "Geblokkeerd"]} />);
    expect(screen.getByText("VIP")).toBeInTheDocument();
    expect(screen.getByText("Geblokkeerd")).toBeInTheDocument();
  });

  it("renders actions", () => {
    render(<EntityDetailHeader title="CONE LIGHTING BV" actions={<button>Verbeteren</button>} />);
    expect(screen.getByRole("button", { name: "Verbeteren" })).toBeInTheDocument();
  });

  it("shows a dirty indicator when dirty is true", () => {
    render(<EntityDetailHeader title="CONE LIGHTING BV" dirty />);
    expect(screen.getByText("Niet-bewaarde wijzigingen")).toBeInTheDocument();
  });

  it("does not show a dirty indicator when dirty is false", () => {
    render(<EntityDetailHeader title="CONE LIGHTING BV" dirty={false} />);
    expect(screen.queryByText("Niet-bewaarde wijzigingen")).not.toBeInTheDocument();
  });
});

