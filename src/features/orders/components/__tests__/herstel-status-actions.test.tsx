import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HerstelStatusActions } from "../herstel-status-actions";
import type { BonHerstelItem } from "@/lib/api-client";

const naarDiagnoseMock = vi.fn();
const bestellenMock = vi.fn();
const hersteldMock = vi.fn();
vi.mock("@/lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-client")>("@/lib/api-client");
  return {
    ...actual,
    bonHerstelNaarDiagnose: (...args: unknown[]) => naarDiagnoseMock(...args),
    bonHerstelOnderdelenBestellen: (...args: unknown[]) => bestellenMock(...args),
    bonHerstelHersteld: (...args: unknown[]) => hersteldMock(...args),
  };
});

function makeHerstel(stempel: BonHerstelItem["stempel"]): BonHerstelItem {
  return {
    bonnr: 100,
    artnr: "ART-1",
    omschr: "",
    probleem: "",
    facnr: 0,
    facDatum: null,
    ordnr: 0,
    levDatum: null,
    bestek: "",
    bestekKosten: 0,
    stempel,
    herstelling: "",
    datum: null,
    refLev: "",
    rapnr: "",
    levnr: 0,
    locatie: "",
    herstelDatum: null,
    herstelLocatieDatum: null,
    technieker: "",
    maxKosten: 0,
    garantie: false,
    prior: 0,
    opmTechn: "",
  };
}

beforeEach(() => {
  naarDiagnoseMock.mockReset();
  bestellenMock.mockReset();
  hersteldMock.mockReset();
});

describe("HerstelStatusActions", () => {
  it("only enables 'Naar diagnose' when stempel is ONTVANGST", () => {
    render(
      <HerstelStatusActions bonnr={100} herstel={makeHerstel("ONTVANGST")} onUpdated={() => {}} />
    );

    expect(screen.getByRole("button", { name: "Naar diagnose" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Onderdelen bestellen" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Hersteld" })).toBeDisabled();
  });

  it("only enables 'Onderdelen bestellen' when stempel is DIAGNOSE", async () => {
    const user = userEvent.setup();
    const onUpdated = vi.fn();
    const updated = makeHerstel("OND.BESTELD");
    bestellenMock.mockResolvedValue(updated);

    render(
      <HerstelStatusActions bonnr={100} herstel={makeHerstel("DIAGNOSE")} onUpdated={onUpdated} />
    );

    expect(screen.getByRole("button", { name: "Naar diagnose" })).toBeDisabled();
    const button = screen.getByRole("button", { name: "Onderdelen bestellen" });
    expect(button).toBeEnabled();

    await user.click(button);

    await waitFor(() => expect(bestellenMock).toHaveBeenCalledWith(100));
    expect(onUpdated).toHaveBeenCalledWith(updated);
  });

  it("shows a read-only indicator (no button) for OND.BESTELD, since that transition is automatic", () => {
    render(
      <HerstelStatusActions bonnr={100} herstel={makeHerstel("OND.BESTELD")} onUpdated={() => {}} />
    );

    expect(
      screen.getByText("Wacht op automatische overgang naar IN HERSTELLING")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Onderdelen bestellen" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Hersteld" })).toBeDisabled();
  });

  it("only enables 'Hersteld' when stempel is IN HERSTELLING", async () => {
    const user = userEvent.setup();
    hersteldMock.mockResolvedValue(makeHerstel("HERSTELD"));

    render(
      <HerstelStatusActions bonnr={100} herstel={makeHerstel("IN HERSTELLING")} onUpdated={() => {}} />
    );

    const button = screen.getByRole("button", { name: "Hersteld" });
    expect(button).toBeEnabled();
    await user.click(button);
    await waitFor(() => expect(hersteldMock).toHaveBeenCalledWith(100));
  });

  it("surfaces the backend's exact error message on a 409", async () => {
    const user = userEvent.setup();
    naarDiagnoseMock.mockRejectedValue(new Error("Bon is geen HERSTELLING."));

    render(
      <HerstelStatusActions bonnr={100} herstel={makeHerstel("ONTVANGST")} onUpdated={() => {}} />
    );

    await user.click(screen.getByRole("button", { name: "Naar diagnose" }));

    expect(await screen.findByText("Bon is geen HERSTELLING.")).toBeInTheDocument();
  });
});
