import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DataTablePanel } from "../data-table-panel";

describe("DataTablePanel", () => {
  it("renders the title as a heading", () => {
    render(
      <DataTablePanel title="Offertes">
        <p>content</p>
      </DataTablePanel>
    );
    expect(screen.getByRole("heading", { name: "Offertes" })).toBeInTheDocument();
  });

  it("renders the children", () => {
    render(
      <DataTablePanel title="Offertes">
        <p>Table content</p>
      </DataTablePanel>
    );
    expect(screen.getByText("Table content")).toBeInTheDocument();
  });

  it("renders the action next to the title", () => {
    render(
      <DataTablePanel title="Offertes" action={<button>Nieuw</button>}>
        <p>content</p>
      </DataTablePanel>
    );
    expect(screen.getByRole("button", { name: "Nieuw" })).toBeInTheDocument();
  });

  it("renders the footer below the children", () => {
    render(
      <DataTablePanel title="Offertes" footer={<div>Paginering</div>}>
        <p>content</p>
      </DataTablePanel>
    );
    expect(screen.getByText("Paginering")).toBeInTheDocument();
  });
});

