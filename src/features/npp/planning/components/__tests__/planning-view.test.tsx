import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlanningView } from "../planning-view";

const getPlanningQueue = vi.fn();
vi.mock("@/lib/api-client", () => ({
  getPlanningQueue: () => getPlanningQueue(),
}));

describe("PlanningView", () => {
  beforeEach(() => {
    getPlanningQueue.mockReset();
  });

  it("shows header copy and a loading state", () => {
    getPlanningQueue.mockReturnValue(new Promise(() => {}));
    render(<PlanningView />);
    expect(screen.getByRole("heading", { name: "Productiewachtrij" })).toBeInTheDocument();
    expect(
      screen.getByText("LED-montagelijnen die klaarstaan voor productie, gesorteerd op leverdatum.")
    ).toBeInTheDocument();
    expect(screen.getByText("Wachtrij wordt geladen...")).toBeInTheDocument();
  });

  it("shows the empty state", async () => {
    getPlanningQueue.mockResolvedValue({ items: [] });
    render(<PlanningView />);
    expect(await screen.findByText("Wachtrij is leeg")).toBeInTheDocument();
    expect(
      screen.getByText("Er staan momenteel geen LED-montagelijnen in de wachtrij.")
    ).toBeInTheDocument();
  });

  it("shows an error", async () => {
    getPlanningQueue.mockRejectedValue(new Error("Boem"));
    render(<PlanningView />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Boem");
  });

  it("renders groups and refreshes on click", async () => {
    getPlanningQueue.mockResolvedValue({
      items: [
        { bonnr: 1, groepnr: 1, lijnnr: 1, klant: "K1", artnr: "A", omschrijving: "O", aantal: 3, levDatum: "2000-01-01" },
        { bonnr: 2, groepnr: 1, lijnnr: 1, klant: "K2", artnr: "A", omschrijving: "O", aantal: 1, levDatum: null },
      ],
    });
    render(<PlanningView />);
    expect(await screen.findByRole("heading", { name: "Achterstallig" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Geen leverdatum" })).toBeInTheDocument();
    expect(screen.getByText("Lev: 01/01/2000")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Vernieuwen" }));
    await waitFor(() => expect(getPlanningQueue).toHaveBeenCalledTimes(2));
  });
});
