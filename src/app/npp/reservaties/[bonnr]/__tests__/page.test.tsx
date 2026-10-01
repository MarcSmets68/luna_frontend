import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getNppReservatieDetail } from "@/lib/api-client";
import NppReservatieDetailPage from "../page";

let search = "";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/npp/reservaties/100",
  useParams: () => ({ bonnr: "100" }),
  useSearchParams: () => new URLSearchParams(search),
}));
vi.mock("@/lib/api-client", () => ({ getNppReservatieDetail: vi.fn() }));
const mockGet = vi.mocked(getNppReservatieDetail);

describe("Npp Reservatie detail page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({
      bonnr: 100,
      groepnr: 0,
      nBedrag: 0,
      items: [],
    });
  });

  it("fetches without groepnr and links back to the queue", async () => {
    search = "";
    render(<NppReservatieDetailPage />);
    await screen.findByRole("heading");
    expect(mockGet).toHaveBeenCalledWith(100, undefined);
    expect(screen.getByRole("link", { name: /Terug/ })).toHaveAttribute(
      "href",
      "/npp/reservaties",
    );
  });

  it("passes groepnr and links back to the productie tab", async () => {
    search = "groepnr=2";
    render(<NppReservatieDetailPage />);
    await screen.findByRole("heading");
    expect(mockGet).toHaveBeenCalledWith(100, 2);
    expect(screen.getByRole("link", { name: /Terug/ })).toHaveAttribute(
      "href",
      "/npp/reservaties?mode=productie",
    );
  });
});
