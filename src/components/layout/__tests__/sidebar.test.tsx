import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Sidebar } from "../sidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

describe("Sidebar", () => {
  it("renders 'Offertes' collapsed by default with its submenu hidden", () => {
    render(<Sidebar />);
    expect(screen.getByRole("button", { name: /offertes/i })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: /alle offertes/i })).not.toBeInTheDocument();
  });

  it("expands the 'Offertes' submenu on click, revealing 'Alle offertes'", () => {
    render(<Sidebar />);

    fireEvent.click(screen.getByRole("button", { name: /offertes/i }));

    expect(screen.getByRole("button", { name: /offertes/i })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: /alle offertes/i })).toHaveAttribute("href", "/offertes/alle");
  });

  it("collapses the submenu again on a second click", () => {
    render(<Sidebar />);

    const toggle = screen.getByRole("button", { name: /offertes/i });
    fireEvent.click(toggle);
    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: /alle offertes/i })).not.toBeInTheDocument();
  });

  it("expands the 'Orders & Productie' submenu on click, revealing 'Alle orders' and 'Lakproduktie'", () => {
    render(<Sidebar />);

    fireEvent.click(screen.getByRole("button", { name: /orders & productie/i }));

    expect(screen.getByRole("button", { name: /orders & productie/i })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: /alle orders/i })).toHaveAttribute("href", "/orders/alle");
    expect(screen.getByRole("link", { name: /lakproduktie/i })).toHaveAttribute("href", "/lakproduktie");
  });

  it("shows the 'Users (dev)' nav item outside production", () => {
    vi.stubEnv("NODE_ENV", "development");
    render(<Sidebar />);
    expect(screen.getByRole("link", { name: /users \(dev\)/i })).toHaveAttribute("href", "/dev-users");
    vi.unstubAllEnvs();
  });

  it("hides the 'Users (dev)' nav item when NODE_ENV=production", () => {
    vi.stubEnv("NODE_ENV", "production");
    render(<Sidebar />);
    expect(screen.queryByRole("link", { name: /users \(dev\)/i })).not.toBeInTheDocument();
    vi.unstubAllEnvs();
  });
});
