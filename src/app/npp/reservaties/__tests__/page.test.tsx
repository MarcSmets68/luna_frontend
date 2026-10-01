import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import NppReservaties from "../page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/npp/reservaties",
}));
vi.mock("@/lib/api-client", () => ({
  getReservatieQueue: vi.fn().mockResolvedValue({ mode: "direct", dringendDagen: 0, items: [] }),
  getReservatieDetail: vi.fn(),
}));

describe("Npp Reservaties page", () => {
  it("renders the shared Topbar and the reservaties view", async () => {
    render(<NppReservaties />);
    expect(screen.getByRole("button", { name: "Uitloggen" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Reservaties" })).toBeInTheDocument();
    expect(await screen.findByText("Geen reservaties")).toBeInTheDocument();
  });
});
