import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BoxScanView } from "../box-scan-view";
import { getBoxOverzicht } from "@/lib/api-client";

vi.mock("@/lib/api-client", () => ({ getBoxOverzicht: vi.fn() }));
vi.mock("jsbarcode", () => ({ default: vi.fn() }));

const mockedGetBoxOverzicht = vi.mocked(getBoxOverzicht);

async function scan(value: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Boxlabel scannen"), value + "{Enter}");
}

describe("BoxScanView", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("shows the article list on a successful scan with articles", async () => {
    mockedGetBoxOverzicht.mockResolvedValue({
      bonnr: 12345,
      groepnr: 1,
      klant: "CONE LIGHTING BV",
      opmerking: "niets",
      empty: false,
      articles: [{ artnr: "ART-1", omschrijving: "Profiel", aantal: 2, barcode: "111" }],
    });
    render(<BoxScanView />);

    await scan("B12345-1");

    await waitFor(() => expect(screen.getByText("ART-1")).toBeInTheDocument());
    expect(screen.getByText(/Bon 12345/)).toBeInTheDocument();
    expect(mockedGetBoxOverzicht).toHaveBeenCalledWith("B12345-1");
  });

  it("shows the empty state when result.empty is true, regardless of articles", async () => {
    mockedGetBoxOverzicht.mockResolvedValue({
      bonnr: 12345,
      groepnr: 2,
      klant: "CONE LIGHTING BV",
      opmerking: "niets",
      empty: true,
      articles: [],
    });
    render(<BoxScanView />);

    await scan("B12345-2");

    await waitFor(() => expect(screen.getByText("Deze box is leeg")).toBeInTheDocument());
  });

  it("shows the backends error message as-is on a failed scan", async () => {
    mockedGetBoxOverzicht.mockRejectedValue(new Error("Onbekend boxlabel"));
    render(<BoxScanView />);

    await scan("garbage");

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Onbekend boxlabel"));
  });

  it("supports in-place re-scan: a second scan replaces the first result without unmounting", async () => {
    mockedGetBoxOverzicht.mockResolvedValueOnce({
      bonnr: 111,
      groepnr: 1,
      klant: "Klant A",
      opmerking: "niets",
      empty: false,
      articles: [{ artnr: "ART-1", omschrijving: "Profiel", aantal: 1, barcode: "" }],
    });
    render(<BoxScanView />);

    await scan("111-1");
    await waitFor(() => expect(screen.getByText(/Bon 111/)).toBeInTheDocument());

    mockedGetBoxOverzicht.mockResolvedValueOnce({
      bonnr: 222,
      groepnr: 1,
      klant: "Klant B",
      opmerking: "niets",
      empty: false,
      articles: [{ artnr: "ART-2", omschrijving: "Ander profiel", aantal: 4, barcode: "" }],
    });

    await scan("222-1");

    await waitFor(() => expect(screen.getByText(/Bon 222/)).toBeInTheDocument());
    expect(screen.queryByText(/Bon 111/)).not.toBeInTheDocument();
    // The scan input itself is still on screen (no route change/unmount).
    expect(screen.getByLabelText("Boxlabel scannen")).toBeInTheDocument();
  });

  it("prints the already-fetched article data without a second backend call", async () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});
    mockedGetBoxOverzicht.mockResolvedValue({
      bonnr: 12345,
      groepnr: 1,
      klant: "CONE LIGHTING BV",
      opmerking: "niets",
      empty: false,
      articles: [{ artnr: "ART-1", omschrijving: "Profiel", aantal: 2, barcode: "111" }],
    });
    render(<BoxScanView />);
    await scan("B12345-1");
    await waitFor(() => expect(screen.getByText("ART-1")).toBeInTheDocument());

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /Print label/ }));

    expect(printSpy).toHaveBeenCalledTimes(1);
    expect(mockedGetBoxOverzicht).toHaveBeenCalledTimes(1);
  });
});
