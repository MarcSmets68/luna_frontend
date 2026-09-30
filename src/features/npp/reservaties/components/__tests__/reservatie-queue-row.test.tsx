import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { NppReservatieQueueItem } from "../../types";
import { ReservatieQueueRow } from "../reservatie-queue-row";

const base: NppReservatieQueueItem = {
  bonnr: 100,
  groepnr: 0,
  datum: "2026-01-02",
  levDatum: null,
  naam: "ACME",
  plaatsingWijze: "Afhaling",
  transport: "Eigen",
  stempel: "B",
  lockId: "",
  dringend: false,
  swReservatie: false,
  swProductie: false,
  swNomaled: false,
  verwijderd: false,
  deleteOpm: null,
};

describe("ReservatieQueueRow", () => {
  it("renders a live row as a link, with dash for missing levDatum", () => {
    render(<ReservatieQueueRow item={base} />);
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/npp/reservaties/100",
    );
    expect(screen.getByText(/02\/01\/2026/)).toBeInTheDocument();
    expect(screen.getByText(/Lev: \u2013/)).toBeInTheDocument();
    expect(screen.queryByText(/LVB/)).not.toBeInTheDocument();
  });

  it("appends groepnr and shows LVB in productie mode", () => {
    render(<ReservatieQueueRow item={{ ...base, groepnr: 3 }} productie />);
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/npp/reservaties/100?groepnr=3",
    );
    expect(screen.getByText(/LVB 3/)).toBeInTheDocument();
  });

  it("shows all badges and lock text", () => {
    render(
      <ReservatieQueueRow
        item={{
          ...base,
          dringend: true,
          swNomaled: true,
          swProductie: true,
          swReservatie: true,
          lockId: "JAN",
        }}
      />,
    );
    for (const t of [
      "Dringend",
      "In de min",
      "Productie niet mogelijk",
      "Reservatie",
    ]) {
      expect(screen.getByText(t)).toBeInTheDocument();
    }
    expect(screen.getByText("Vergrendeld door JAN")).toBeInTheDocument();
  });

  it("renders deleted rows as non-links with the delete reason", () => {
    render(
      <ReservatieQueueRow
        item={{ ...base, verwijderd: true, deleteOpm: "Dubbel" }}
      />,
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("Verwijderd")).toBeInTheDocument();
    expect(screen.getByText("Dubbel")).toBeInTheDocument();
  });
});
