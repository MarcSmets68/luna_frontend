import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import NppScannen from "../page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/npp/scannen",
}));

describe("Npp Scannen page", () => {
  it("renders the shared Topbar and the artikel scan view without an initial fetch", () => {
    render(<NppScannen />);
    expect(screen.getByRole("button", { name: "Uitloggen" })).toBeInTheDocument();
    expect(screen.getByLabelText("Artikel scannen")).toBeInTheDocument();
    expect(screen.queryByText("Artikel niet gevonden")).not.toBeInTheDocument();
  });
});
