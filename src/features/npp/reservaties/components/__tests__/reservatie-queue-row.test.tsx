import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ReservatieQueueRow } from "../reservatie-queue-row";
import type { ReservatieQueueItem } from "../../types";

const ITEM: ReservatieQueueItem = {
  bonnr: 20345,
  groepnr: 0,
  datum: "2026-09-01",
  levDatum: "2026-09-10",
  naam: "Jansen",
  plaatsingWijze: "Montage",
  transport: "Eigen vervoer",
  stempel: "",
  lockId: "",
  dringend: false,
  swReservatie: true,
  swProductie: false,
  swNomaled: false,
  verwijderd: false,
  deleteOpm: null,
};

describe("ReservatieQueueRow", () => {
  it("renders bon, klant, meta and leverdatum in direct mode and forwards onOpen", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(<ReservatieQueueRow item={ITEM} mode="direct" onOpen={onOpen} />);
    expect(screen.getByText("Bon 20345")).toBeInTheDocument();
    expect(screen.getByText("Jansen")).toBeInTheDocument();
    expect(screen.getByText("Montage \u00b7 Eigen vervoer")).toBeInTheDocument();
    expect(screen.getByText("Lev: 10/09/2026")).toBeInTheDocument();
    await user.click(screen.getByRole("button"));
    expect(onOpen).toHaveBeenCalled();
  });

  it("shows groepnr and productiedatum in productie mode", () => {
    render(<ReservatieQueueRow item={{ ...ITEM, groepnr: 3 }} mode="productie" onOpen={() => {}} />);
    expect(screen.getByText("Bon 20345 / 3")).toBeInTheDocument();
    expect(screen.getByText("Productie: 10/09/2026")).toBeInTheDocument();
  });

  it("shows the status badges and the delete remark", () => {
    render(
      <ReservatieQueueRow
        item={{
          ...ITEM,
          dringend: true,
          swProductie: true,
          swNomaled: true,
          verwijderd: true,
          deleteOpm: "Klant annuleerde",
        }}
        mode="direct"
        onOpen={() => {}}
      />
    );
    expect(screen.getByText("Dringend")).toBeInTheDocument();
    expect(screen.getByText("Onvoldoende voor productie")).toBeInTheDocument();
    expect(screen.getByText("Nomaled")).toBeInTheDocument();
    expect(screen.getByText("Verwijderd")).toBeInTheDocument();
    expect(screen.getByText("Opmerking: Klant annuleerde")).toBeInTheDocument();
  });

  it("hides the badges when no flags are set", () => {
    render(<ReservatieQueueRow item={ITEM} mode="direct" onOpen={() => {}} />);
    expect(screen.queryByText("Dringend")).not.toBeInTheDocument();
    expect(screen.queryByText("Verwijderd")).not.toBeInTheDocument();
  });
});
