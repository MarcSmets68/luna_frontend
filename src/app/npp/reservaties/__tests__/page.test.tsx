import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getNppReservatieQueue } from "@/lib/api-client";
import NppReservaties from "../page";

let search = "";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/npp/reservaties",
  useSearchParams: () => new URLSearchParams(search),
}));
vi.mock("@/lib/api-client", () => ({ getNppReservatieQueue: vi.fn() }));
const mockGet = vi.mocked(getNppReservatieQueue);

describe("Npp Reservaties page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ mode: "direct", dringendDagen: 3, items: [] });
  });

  it("defaults to direct mode", async () => {
    search = "";
    render(<NppReservaties />);
    expect(
      screen.getByRole("button", { name: "Uitloggen" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Direct" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await screen.findByText("Geen reservaties");
    expect(mockGet).toHaveBeenCalledWith("direct");
  });

  it("reads mode=productie from the URL", async () => {
    search = "mode=productie";
    render(<NppReservaties />);
    await screen.findByText("Geen reservaties");
    expect(mockGet).toHaveBeenCalledWith("productie");
  });
});
