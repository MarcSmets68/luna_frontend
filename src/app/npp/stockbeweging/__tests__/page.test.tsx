import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import NppStockbeweging from "../page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/npp/stockbeweging",
}));

describe("Npp Stockbeweging page", () => {
  it("renders the shared Topbar and the stockbeweging view without an initial fetch", () => {
    render(<NppStockbeweging />);
    expect(screen.getByRole("button", { name: "Uitloggen" })).toBeInTheDocument();
    expect(screen.getByLabelText("Artikel scannen")).toBeInTheDocument();
    expect(screen.queryByText("Artikel niet gevonden")).not.toBeInTheDocument();
  });
});
