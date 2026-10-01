import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReservatiesView } from "../reservaties-view";

const getReservatieQueue = vi.fn();
const getReservatieDetail = vi.fn();
vi.mock("@/lib/api-client", () => ({
  getReservatieQueue: (mode: string) => getReservatieQueue(mode),
  getReservatieDetail: (bonnr: number, groepnr: number) => getReservatieDetail(bonnr, groepnr),
}));

const ITEM = {
  bonnr: 20345,
  groepnr: 0,
  datum: null,
  levDatum: null,
  naam: "Jansen",
  plaatsingWijze: "",
  transport: "",
  stempel: "",
  lockId: "",
  dringend: false,
  swReservatie: true,
  swProductie: false,
  swNomaled: false,
  verwijderd: false,
  deleteOpm: null,
};

describe("ReservatiesView", () => {
  beforeEach(() => {
    getReservatieQueue.mockReset();
    getReservatieDetail.mockReset();
  });

  it("shows header and a loading state", () => {
    getReservatieQueue.mockReturnValue(new Promise(() => {}));
    render(<ReservatiesView />);
    expect(screen.getByRole("heading", { name: "Reservaties" })).toBeInTheDocument();
    expect(screen.getByText("Reservaties worden geladen...")).toBeInTheDocument();
  });

  it("shows the empty state", async () => {
    getReservatieQueue.mockResolvedValue({ mode: "direct", dringendDagen: 0, items: [] });
    render(<ReservatiesView />);
    expect(await screen.findByText("Geen reservaties")).toBeInTheDocument();
  });

  it("shows an error", async () => {
    getReservatieQueue.mockRejectedValue(new Error("Boem"));
    render(<ReservatiesView />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Boem");
  });

  it("switches mode and refreshes", async () => {
    const user = userEvent.setup();
    getReservatieQueue.mockResolvedValue({ mode: "direct", dringendDagen: 0, items: [] });
    render(<ReservatiesView />);
    await screen.findByText("Geen reservaties");

    await user.click(screen.getByRole("tab", { name: "Productie" }));
    await waitFor(() => expect(getReservatieQueue).toHaveBeenLastCalledWith("productie"));
    expect(screen.getByRole("tab", { name: "Productie" })).toHaveAttribute("aria-selected", "true");

    await user.click(screen.getByRole("button", { name: "Vernieuwen" }));
    await waitFor(() => expect(getReservatieQueue).toHaveBeenCalledTimes(3));
  });

  it("opens the detail of a row and returns to the queue", async () => {
    const user = userEvent.setup();
    getReservatieQueue.mockResolvedValue({ mode: "direct", dringendDagen: 0, items: [ITEM] });
    getReservatieDetail.mockResolvedValue({ bonnr: 20345, groepnr: 0, nBedrag: 0, items: [] });
    render(<ReservatiesView />);

    await user.click(await screen.findByRole("button", { name: /Bon 20345/ }));
    expect(await screen.findByText("Deze bon heeft geen lijnen.")).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Direct" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Terug" }));
    expect(await screen.findByRole("tab", { name: "Direct" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Bon 20345/ })).toBeInTheDocument();
  });
});
