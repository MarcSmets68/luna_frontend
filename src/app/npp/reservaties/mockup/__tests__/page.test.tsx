import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import NppReservatiesMockupPage from "../page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/npp/reservaties/mockup",
  useSearchParams: () => new URLSearchParams(),
}));

describe("Npp Reservaties mockup page", () => {
  it("renders the mockup banner and the workflow", () => {
    render(<NppReservatiesMockupPage />);
    expect(
      screen.getByText(/Mockup.*niet gekoppeld aan de backend/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Uitloggen" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Reservatie van onderdelen \(mockup\)/)).toBeInTheDocument();
  });
});
