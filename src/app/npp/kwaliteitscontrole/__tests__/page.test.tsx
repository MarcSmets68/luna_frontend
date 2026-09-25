import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import NppKwaliteitscontrole from "../page";
import { getKwaliteitscontroleQueue } from "@/lib/api-client";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/npp/kwaliteitscontrole",
}));

vi.mock("@/lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-client")>("@/lib/api-client");
  return {
    ...actual,
    getKwaliteitscontroleQueue: vi.fn(),
  };
});

const mockedGetQueue = vi.mocked(getKwaliteitscontroleQueue);

describe("Npp Kwaliteitscontrole page", () => {
  it("renders the shared Topbar and the kwaliteitscontrole view", () => {
    mockedGetQueue.mockResolvedValue({ items: [] });
    render(<NppKwaliteitscontrole />);
    expect(screen.getByRole("button", { name: "Uitloggen" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Kwaliteitscontrole" })).toBeInTheDocument();
  });
});
