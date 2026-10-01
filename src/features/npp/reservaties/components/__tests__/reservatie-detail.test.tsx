import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getNppReservatieDetail } from "@/lib/api-client";
import { ReservatieDetail } from "../reservatie-detail";

vi.mock("@/lib/api-client", () => ({ getNppReservatieDetail: vi.fn() }));
const mockGet = vi.mocked(getNppReservatieDetail);

describe("ReservatieDetail", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders header with LVB and EUR amount, plus rows", async () => {
    mockGet.mockResolvedValue({
      bonnr: 100,
      groepnr: 2,
      nBedrag: 1234.5,
      items: [
        {
          lijnnr: 10,
          groepnr: 2,
          artnr: "ART-1",
          omschrijving: "Profiel",
          teLeveren: 1,
          gereserv: 1,
          effectiefGereserv: 1,
          swEffectief: true,
          effectiefStatus: "volledig_effectief",
          kolomtitel: false,
          infolijn: false,
          subtotaal: false,
        },
      ],
    });
    render(<ReservatieDetail bonnr={100} groepnr={2} />);
    expect(await screen.findByRole("heading")).toHaveTextContent(
      "Bon 100 \u00b7 LVB 2",
    );
    expect(screen.getByText(/1\.234,50/)).toBeInTheDocument();
    expect(screen.getByText("Volledig")).toBeInTheDocument();
  });

  it("omits LVB when groepnr is 0", async () => {
    mockGet.mockResolvedValue({
      bonnr: 100,
      groepnr: 0,
      nBedrag: 0,
      items: [],
    });
    render(<ReservatieDetail bonnr={100} />);
    expect(await screen.findByRole("heading")).toHaveTextContent(/^Bon 100$/);
  });

  it("shows errors", async () => {
    mockGet.mockRejectedValue(new Error("Bon niet gevonden"));
    render(<ReservatieDetail bonnr={1} />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Bon niet gevonden",
    );
  });
});
