import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BonlijnReserveringDialog } from "../bonlijn-reservering-dialog";
import type { BonLijnItem } from "@/lib/api-client";

const reserveerBonLijnMock = vi.fn();
vi.mock("@/lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-client")>("@/lib/api-client");
  return {
    ...actual,
    reserveerBonLijn: (...args: unknown[]) => reserveerBonLijnMock(...args),
  };
});

const mockLijn: BonLijnItem = {
  bonnr: 100,
  lijnnr: 1,
  stempel: "",
  artnr: "ART-1",
  omschrijving: "Test lijn",
  aantal: 10,
  teLeveren: 10,
  besteld: 0,
  vprijs: 1,
  aprijs: 1,
  korting: 0,
  btwKode: "1",
  bedrag: 10,
  levDatum: null,
  bestelDatum: null,
  klnr: 1,
  groepnr: 1,
  subgroepnr: 1,
  hold: false,
  opm: "",
  subtotaal: false,
  kolomtitel: false,
  infolijn: false,
  gereserv: 4,
  effectiefGereserv: 4,
  swEffectief: true,
};

beforeEach(() => {
  reserveerBonLijnMock.mockReset();
});

describe("BonlijnReserveringDialog", () => {
  it("posts the entered delta and calls onReserved with the response", async () => {
    const user = userEvent.setup();
    const onReserved = vi.fn();
    const updated = { ...mockLijn, gereserv: 6, effectiefGereserv: 6 };
    reserveerBonLijnMock.mockResolvedValue(updated);

    render(
      <BonlijnReserveringDialog
        bonnr={100}
        lijn={mockLijn}
        open={true}
        onOpenChange={() => {}}
        onReserved={onReserved}
      />
    );

    const input = screen.getByLabelText("Delta");
    await user.clear(input);
    await user.type(input, "2");
    await user.click(screen.getByRole("button", { name: "Bevestigen" }));

    await waitFor(() => expect(reserveerBonLijnMock).toHaveBeenCalledWith(100, 1, 2));
    expect(onReserved).toHaveBeenCalledWith(updated);
  });

  it("shows a validation error for a delta of 0 without calling the API", async () => {
    const user = userEvent.setup();

    render(
      <BonlijnReserveringDialog
        bonnr={100}
        lijn={mockLijn}
        open={true}
        onOpenChange={() => {}}
        onReserved={() => {}}
      />
    );

    await user.click(screen.getByRole("button", { name: "Bevestigen" }));

    expect(await screen.findByText("Vul een geldig getal in, ongelijk aan 0.")).toBeInTheDocument();
    expect(reserveerBonLijnMock).not.toHaveBeenCalled();
  });

  it("surfaces the backend's exact error message on failure", async () => {
    const user = userEvent.setup();
    reserveerBonLijnMock.mockRejectedValue(new Error("Delta buiten toegelaten bereik."));

    render(
      <BonlijnReserveringDialog
        bonnr={100}
        lijn={mockLijn}
        open={true}
        onOpenChange={() => {}}
        onReserved={() => {}}
      />
    );

    const input = screen.getByLabelText("Delta");
    await user.clear(input);
    await user.type(input, "999");
    await user.click(screen.getByRole("button", { name: "Bevestigen" }));

    expect(await screen.findByText("Delta buiten toegelaten bereik.")).toBeInTheDocument();
  });
});
