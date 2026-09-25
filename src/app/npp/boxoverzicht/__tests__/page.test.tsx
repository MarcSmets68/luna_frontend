import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import NppBoxoverzicht from "../page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/npp/boxoverzicht",
}));
vi.mock("jsbarcode", () => ({ default: vi.fn() }));

describe("Npp Boxoverzicht page", () => {
  it("renders the shared Topbar and the scan view without an initial fetch", () => {
    render(<NppBoxoverzicht />);
    expect(screen.getByRole("button", { name: "Uitloggen" })).toBeInTheDocument();
    expect(screen.getByLabelText("Boxlabel scannen")).toBeInTheDocument();
    expect(screen.queryByText(/Bon /)).not.toBeInTheDocument();
  });
});
