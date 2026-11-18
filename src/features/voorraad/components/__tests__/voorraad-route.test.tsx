import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import Voorraad from "@/app/voorraad/page";
import { getArtikelen } from "@/lib/api-client";
import { VoorraadPage } from "../voorraad-page";

vi.mock("@/lib/api-client", () => ({ getArtikelen: vi.fn() }));
vi.mock("@/components/layout/app-shell", () => ({ AppShell: ({ children }: { children: ReactNode }) => children }));
vi.mock("../voorraad-page", () => ({ VoorraadPage: vi.fn(() => null) }));

describe("voorraad route search", () => {
  it("passes all URL filters to the backend instead of filtering the current page locally", async () => {
    vi.mocked(getArtikelen).mockResolvedValue({ items: [], page: 3, pageSize: 25, hasMore: false });
    render(await Voorraad({ searchParams: Promise.resolve({ page: "3", artnr: "100%", omschrijving: "LED & wit", lageVoorraad: "true", toonGeblokkeerd: "true" }) }));
    expect(getArtikelen).toHaveBeenCalledWith(3, 25, { lageVoorraad: true, geblokkeerd: undefined, artnr: "100%", omschrijving: "LED & wit" });
    expect(vi.mocked(VoorraadPage).mock.calls[0][0]).toMatchObject({ page: 3, artnr: "100%", omschrijving: "LED & wit", lageVoorraad: true, toonGeblokkeerd: true });
  });
});
