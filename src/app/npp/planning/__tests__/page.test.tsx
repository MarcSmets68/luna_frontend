import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import NppPlanning from "../page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/npp/planning",
}));
vi.mock("@/lib/api-client", () => ({
  getPlanningQueue: vi.fn().mockResolvedValue({ items: [] }),
}));

describe("Npp Planning page", () => {
  it("renders the shared Topbar and the production queue view", async () => {
    render(<NppPlanning />);
    expect(screen.getByRole("button", { name: "Uitloggen" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Productiewachtrij" })).toBeInTheDocument();
    expect(await screen.findByText("Wachtrij is leeg")).toBeInTheDocument();
  });
});
