import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import OfferteLoading from "./loading";
import OfferteError from "./error";
import OfferteDetail from "./page";

const { getOfferteMock, getOfferteLijnenMock, refreshMock } = vi.hoisted(() => ({
  getOfferteMock: vi.fn(),
  getOfferteLijnenMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("@/components/layout/app-shell", () => ({
  AppShell: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));
vi.mock("@/features/offertes/components/offerte-detail-page", () => ({
  OfferteDetailPage: () => <div>Offertedetails</div>,
}));
vi.mock("@/lib/api-client", () => ({
  getOfferte: getOfferteMock,
  getOfferteLijnen: getOfferteLijnenMock,
}));

beforeEach(() => {
  vi.clearAllMocks();
  getOfferteLijnenMock.mockResolvedValue([]);
});

describe("Offerte detail route states", () => {
  it("announces loading in Dutch", () => {
    render(<OfferteLoading />);
    expect(screen.getByRole("status")).toHaveTextContent("Offerte wordt geladen...");
    expect(screen.getByRole("heading", { name: "Offerte" })).toBeVisible();
  });

  it("offers a retry and overview link without exposing error details", async () => {
    const reset = vi.fn();
    render(<OfferteError error={new Error("Private server details")} reset={reset} />);
    expect(screen.getByRole("alert")).toHaveTextContent("De offerte kon niet worden geladen. Probeer het opnieuw.");
    expect(screen.queryByText("Private server details")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Terug naar overzicht" })).toHaveAttribute("href", "/offertes/alle");
    await userEvent.click(screen.getByRole("button", { name: "Opnieuw proberen" }));
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("keeps missing quotations in the not-found flow", async () => {
    getOfferteMock.mockResolvedValue(null);
    render(await OfferteDetail({ params: Promise.resolve({ offnr: "123", versie: "1" }) }));
    expect(screen.getByRole("heading", { name: "Offerte niet gevonden" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Terug naar overzicht" })).toHaveAttribute("href", "/offertes/alle");
    expect(getOfferteLijnenMock).toHaveBeenCalledWith(123, 1);
  });

  it("starts both fetches before either resolves", async () => {
    let resolveHeader!: (value: null) => void;
    let resolveLines!: (value: never[]) => void;
    const header = new Promise<null>((resolve) => { resolveHeader = resolve; });
    const lines = new Promise<never[]>((resolve) => { resolveLines = resolve; });
    getOfferteMock.mockReturnValue(header);
    getOfferteLijnenMock.mockReturnValue(lines);
    const result = OfferteDetail({ params: Promise.resolve({ offnr: "123", versie: "1" }) });
    await Promise.resolve();
    await Promise.resolve();
    expect(getOfferteMock).toHaveBeenCalledWith(123, 1);
    expect(getOfferteLijnenMock).toHaveBeenCalledWith(123, 1);
    resolveHeader(null);
    resolveLines([]);
    render(await result);
    expect(screen.getByRole("heading", { name: "Offerte niet gevonden" })).toBeVisible();
  });

  it("keeps not-found when the missing quotation's lines request fails", async () => {
    getOfferteMock.mockResolvedValue(null);
    getOfferteLijnenMock.mockRejectedValue(new Error("Lines not found"));
    render(await OfferteDetail({ params: Promise.resolve({ offnr: "123", versie: "1" }) }));
    expect(screen.getByRole("heading", { name: "Offerte niet gevonden" })).toBeVisible();
  });

  it("propagates line failures for an existing quotation", async () => {
    const error = new Error("Lines unavailable");
    getOfferteMock.mockResolvedValue({ offnr: 123, versie: 1 });
    getOfferteLijnenMock.mockRejectedValue(error);
    await expect(OfferteDetail({ params: Promise.resolve({ offnr: "123", versie: "1" }) })).rejects.toBe(error);
  });

  it("propagates API failures to the route error boundary", async () => {
    const error = new Error("Service unavailable");
    getOfferteMock.mockRejectedValue(error);
    await expect(OfferteDetail({ params: Promise.resolve({ offnr: "123", versie: "1" }) })).rejects.toBe(error);
  });
});
