import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getNppReservatieQueue } from "@/lib/api-client";
import { ReservatiesOverview } from "../reservaties-overview";

vi.mock("@/lib/api-client", () => ({ getNppReservatieQueue: vi.fn() }));
const mockGet = vi.mocked(getNppReservatieQueue);

const item = {
  bonnr: 100,
  groepnr: 1,
  datum: null,
  levDatum: null,
  naam: "ACME",
  plaatsingWijze: "",
  transport: "",
  stempel: "B",
  lockId: "",
  dringend: false,
  swReservatie: false,
  swProductie: false,
  swNomaled: false,
  verwijderd: false,
  deleteOpm: null,
};

describe("ReservatiesOverview", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows loading then rows", async () => {
    mockGet.mockResolvedValue({
      mode: "productie",
      dringendDagen: 3,
      items: [item],
    });
    render(<ReservatiesOverview mode="productie" onModeChange={vi.fn()} />);
    expect(screen.getByText(/worden geladen/)).toBeInTheDocument();
    expect(await screen.findByText("ACME")).toBeInTheDocument();
    expect(screen.getByText(/LVB 1/)).toBeInTheDocument();
  });

  it("shows the empty state", async () => {
    mockGet.mockResolvedValue({ mode: "direct", dringendDagen: 3, items: [] });
    render(<ReservatiesOverview mode="direct" onModeChange={vi.fn()} />);
    expect(await screen.findByText("Geen reservaties")).toBeInTheDocument();
  });

  it("shows an error", async () => {
    mockGet.mockRejectedValue(new Error("Kapot"));
    render(<ReservatiesOverview mode="direct" onModeChange={vi.fn()} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Kapot");
  });

  it("reports tab changes and refetches on refresh", async () => {
    mockGet.mockResolvedValue({ mode: "direct", dringendDagen: 3, items: [] });
    const onModeChange = vi.fn();
    render(<ReservatiesOverview mode="direct" onModeChange={onModeChange} />);
    await screen.findByText("Geen reservaties");
    fireEvent.click(screen.getByRole("tab", { name: "Productie" }));
    expect(onModeChange).toHaveBeenCalledWith("productie");
    fireEvent.click(screen.getByRole("button", { name: /Vernieuwen/ }));
    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(2));
  });
});
