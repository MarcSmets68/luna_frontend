import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Npp from "../page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/npp",
}));

describe("Npp page", () => {
  it("renders the NPP menu heading and task tiles", () => {
    render(<Npp />);
    expect(screen.getByRole("heading", { name: "NPP" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Scannen \/ verifiëren/ })).toBeInTheDocument();
  });

  it("renders the shared Topbar (logout button present)", () => {
    render(<Npp />);
    expect(screen.getByRole("button", { name: "Uitloggen" })).toBeInTheDocument();
  });

  it("does not render a sidebar/nav element", () => {
    render(<Npp />);
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(screen.queryByText("Noma")).not.toBeInTheDocument();
  });

  it("renders the Boxoverzicht tile as a navigable link to /npp/boxoverzicht", () => {
    render(<Npp />);
    const link = screen.getByRole("link", { name: /Boxoverzicht/ });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/npp/boxoverzicht");
  });

  it("renders the Scannen / verifiëren tile as a navigable link to /npp/scannen", () => {
    render(<Npp />);
    const link = screen.getByRole("link", { name: /Scannen \/ verifiëren/ });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/npp/scannen");
  });

  it("keeps the other tiles inert (plain buttons, not links)", () => {
    render(<Npp />);
    expect(screen.getByRole("button", { name: /Stockbeweging boeken/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Productie starten \/ afsluiten/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Kwaliteitscontrole/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Planning raadplegen/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Reservaties raadplegen/ })).toBeInTheDocument();
    expect(screen.queryAllByRole("link")).toHaveLength(2);
  });
});
