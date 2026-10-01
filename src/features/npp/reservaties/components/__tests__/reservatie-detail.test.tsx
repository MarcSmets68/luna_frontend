import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ReservatieDetail } from "../reservatie-detail";
import type { ReservatieDetailItem, ReservatieQueueItem } from "../../types";

const ITEM: ReservatieQueueItem = {
  bonnr: 20345,
  groepnr: 2,
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

const LINE: ReservatieDetailItem = {
  lijnnr: 2,
  groepnr: 2,
  artnr: "ART-1",
  omschrijving: "Profiel",
  teLeveren: 5,
  gereserv: 5,
  effectiefGereserv: 2,
  swEffectief: true,
  effectiefStatus: "gedeeltelijk_effectief",
  kolomtitel: false,
  infolijn: false,
  subtotaal: false,
};

const TITLE: ReservatieDetailItem = {
  ...LINE,
  lijnnr: 1,
  artnr: "",
  omschrijving: "Keuken",
  effectiefStatus: null,
  kolomtitel: true,
};

describe("ReservatieDetail", () => {
  it("renders header, title lines and article lines with their status", () => {
    render(
      <ReservatieDetail
        item={ITEM}
        detail={{ bonnr: 20345, groepnr: 2, nBedrag: 0, items: [TITLE, LINE] }}
        loading={false}
        error={null}
        onBack={() => {}}
      />
    );
    expect(screen.getByRole("heading", { name: "Bon 20345 / 2" })).toBeInTheDocument();
    expect(screen.getByText("Keuken")).toBeInTheDocument();
    expect(screen.getByText("ART-1 \u00b7 Profiel")).toBeInTheDocument();
    expect(screen.getByText(/Te leveren 5/)).toHaveTextContent(
      "Te leveren 5 · Gereserveerd 5 · Effectief 2"
    );
    expect(screen.getByText("Gedeeltelijk effectief")).toBeInTheDocument();
  });

  it("shows loading, error and empty states", () => {
    const { rerender } = render(
      <ReservatieDetail item={ITEM} detail={null} loading={true} error={null} onBack={() => {}} />
    );
    expect(screen.getByText("Bonlijnen worden geladen...")).toBeInTheDocument();

    rerender(
      <ReservatieDetail item={ITEM} detail={null} loading={false} error="Boem" onBack={() => {}} />
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Boem");

    rerender(
      <ReservatieDetail
        item={ITEM}
        detail={{ bonnr: 20345, groepnr: 2, nBedrag: 0, items: [] }}
        loading={false}
        error={null}
        onBack={() => {}}
      />
    );
    expect(screen.getByText("Deze bon heeft geen lijnen.")).toBeInTheDocument();
  });

  it("calls onBack", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(
      <ReservatieDetail item={ITEM} detail={null} loading={false} error={null} onBack={onBack} />
    );
    await user.click(screen.getByRole("button", { name: "Terug" }));
    expect(onBack).toHaveBeenCalled();
  });
});
