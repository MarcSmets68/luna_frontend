import { describe, expect, it } from "vitest";
import {
  alleOnderdelenVerwerkt,
  createInitialState,
  heeftOpenOnderdelen,
  workflowReducer,
  type WorkflowState,
} from "../reducer";

function selectLijn(state: WorkflowState, lijnId: string): WorkflowState {
  return workflowReducer(state, { type: "SELECT_LIJN", lijnId });
}

describe("reservatie-mockup reducer", () => {
  it("scans the correct part, confirms the amount, and reserves it", () => {
    let state = createInitialState();
    state = selectLijn(state, "lijn-1");
    expect(state.activeOnderdeelId).toBe("l1-o1");

    state = workflowReducer(state, { type: "SCAN_JUIST", onderdeelId: "l1-o1" });
    expect(state.aantal).toBe(12);
    expect(state.foutmelding).toBeNull();

    state = workflowReducer(state, { type: "BEVESTIG_AANTAL" });
    const lijn = state.lijnen.find((l) => l.id === "lijn-1")!;
    const onderdeel = lijn.onderdelen.find((o) => o.id === "l1-o1")!;
    expect(onderdeel.status).toBe("gereserveerd");
    expect(onderdeel.genomenAantal).toBe(12);
    // moved on to the next "te_scannen" part
    expect(state.activeOnderdeelId).toBe("l1-o2");
  });

  it("notifies the supervisor after 3 failed scans", () => {
    let state = createInitialState();
    state = selectLijn(state, "lijn-1");

    state = workflowReducer(state, { type: "SCAN_FOUT", omschrijving: "ander vermogen" });
    expect(state.leidinggevendeVerwittigd).toBe(false);
    expect(state.pogingen).toBe(1);

    state = workflowReducer(state, { type: "SCAN_FOUT", omschrijving: "onleesbaar etiket" });
    expect(state.leidinggevendeVerwittigd).toBe(false);
    expect(state.pogingen).toBe(2);

    state = workflowReducer(state, { type: "SCAN_FOUT", omschrijving: "ander vermogen" });
    expect(state.leidinggevendeVerwittigd).toBe(true);
    expect(state.pogingen).toBe(3);
    expect(state.foutmelding).toMatch(/Leidinggevende verwittigd/);

    state = workflowReducer(state, { type: "ACK_LEIDINGGEVENDE" });
    expect(state.leidinggevendeVerwittigd).toBe(false);
    expect(state.pogingen).toBe(0);
  });

  it("handles a shortage with the part physically present via count-and-correct", () => {
    let state = createInitialState();
    state = selectLijn(state, "lijn-1");
    // l1-o1 has enough stock; confirm it first so the active part becomes l1-o2 (short on stock).
    state = workflowReducer(state, { type: "SCAN_JUIST", onderdeelId: "l1-o1" });
    state = workflowReducer(state, { type: "BEVESTIG_AANTAL" });
    expect(state.activeOnderdeelId).toBe("l1-o2");

    state = workflowReducer(state, { type: "SCAN_JUIST", onderdeelId: "l1-o2" });
    expect(state.aantal).toBe(12);

    state = workflowReducer(state, { type: "BEVESTIG_AANTAL" });
    expect(state.tekortDialogOpen).toBe(true);

    state = workflowReducer(state, { type: "FYSIEK_AANWEZIG", aanwezig: true });
    expect(state.tekortDialogOpen).toBe(false);
    expect(state.tellenDialogOpen).toBe(true);

    state = workflowReducer(state, {
      type: "BEVESTIG_TELLING",
      geteld: 12,
      reden: "verkeerde_locatie",
    });
    expect(state.tellenDialogOpen).toBe(false);
    const lijn = state.lijnen.find((l) => l.id === "lijn-1")!;
    const onderdeel = lijn.onderdelen.find((o) => o.id === "l1-o2")!;
    expect(onderdeel.stock).toBe(12);
    expect(onderdeel.status).toBe("gecorrigeerd");

    // Back to "neem benodigd aantal": confirming now succeeds since stock is sufficient.
    state = workflowReducer(state, { type: "BEVESTIG_AANTAL" });
    const bijgewerkt = state.lijnen
      .find((l) => l.id === "lijn-1")!
      .onderdelen.find((o) => o.id === "l1-o2")!;
    expect(bijgewerkt.status).toBe("gereserveerd");
    expect(state.log.some((l) => l.wat.includes("Telling gecorrigeerd"))).toBe(true);
  });

  it("marks a non-postponable shortage as 'wacht op materiaal' when not present", () => {
    let state = createInitialState();
    state = selectLijn(state, "lijn-1");
    state = workflowReducer(state, { type: "SCAN_JUIST", onderdeelId: "l1-o1" });
    state = workflowReducer(state, { type: "BEVESTIG_AANTAL" });
    state = workflowReducer(state, { type: "SCAN_JUIST", onderdeelId: "l1-o2" });
    state = workflowReducer(state, { type: "BEVESTIG_AANTAL" });
    expect(state.tekortDialogOpen).toBe(true);

    state = workflowReducer(state, { type: "FYSIEK_AANWEZIG", aanwezig: false });
    const lijn = state.lijnen.find((l) => l.id === "lijn-1")!;
    const onderdeel = lijn.onderdelen.find((o) => o.id === "l1-o2")!;
    expect(onderdeel.status).toBe("wacht_op_materiaal");
    expect(lijn.status).toBe("wacht_op_materiaal");
    expect(
      state.log.some((l) => l.wat.includes("planner verwittigd")),
    ).toBe(true);
  });

  it("marks a postponable shortage as 'open' when not present", () => {
    let state = createInitialState();
    state = selectLijn(state, "lijn-1");
    // process l1-o1, l1-o2 (shortage, present), l1-o3 so the active part becomes l1-o4 (postponable, short).
    state = workflowReducer(state, { type: "SCAN_JUIST", onderdeelId: "l1-o1" });
    state = workflowReducer(state, { type: "BEVESTIG_AANTAL" });
    state = workflowReducer(state, { type: "SCAN_JUIST", onderdeelId: "l1-o2" });
    state = workflowReducer(state, { type: "BEVESTIG_AANTAL" });
    state = workflowReducer(state, {
      type: "BEVESTIG_TELLING",
      geteld: 12,
      reden: "andere",
      toelichting: "test",
    });
    state = workflowReducer(state, { type: "BEVESTIG_AANTAL" });
    state = workflowReducer(state, { type: "SCAN_JUIST", onderdeelId: "l1-o3" });
    state = workflowReducer(state, { type: "BEVESTIG_AANTAL" });
    expect(state.activeOnderdeelId).toBe("l1-o4");

    state = workflowReducer(state, { type: "SCAN_JUIST", onderdeelId: "l1-o4" });
    state = workflowReducer(state, { type: "BEVESTIG_AANTAL" });
    expect(state.tekortDialogOpen).toBe(true);

    state = workflowReducer(state, { type: "FYSIEK_AANWEZIG", aanwezig: false });
    const lijn = state.lijnen.find((l) => l.id === "lijn-1")!;
    const onderdeel = lijn.onderdelen.find((o) => o.id === "l1-o4")!;
    expect(onderdeel.status).toBe("open");
    expect(alleOnderdelenVerwerkt(lijn)).toBe(true);
    expect(heeftOpenOnderdelen(lijn)).toBe(true);
  });

  it("blocks 'productie afronden' while open parts remain and allows it once resolved", () => {
    let state = createInitialState();
    // lijn-4 already has one "open" part in the fixtures and is "gereed".
    const lijnVoor = state.lijnen.find((l) => l.id === "lijn-4")!;
    expect(heeftOpenOnderdelen(lijnVoor)).toBe(true);

    state = workflowReducer(state, { type: "AFROND_PRODUCTIE", lijnId: "lijn-4" });
    let lijn = state.lijnen.find((l) => l.id === "lijn-4")!;
    expect(lijn.status).toBe("gereed"); // unchanged - blocked

    state = workflowReducer(state, {
      type: "SCAN_OPEN_ONDERDEEL",
      lijnId: "lijn-4",
      onderdeelId: "l4-o2",
    });
    lijn = state.lijnen.find((l) => l.id === "lijn-4")!;
    expect(heeftOpenOnderdelen(lijn)).toBe(false);

    state = workflowReducer(state, { type: "AFROND_PRODUCTIE", lijnId: "lijn-4" });
    lijn = state.lijnen.find((l) => l.id === "lijn-4")!;
    expect(lijn.status).toBe("afgerond");
  });

  it("allows undoing a confirmed reservation", () => {
    let state = createInitialState();
    state = selectLijn(state, "lijn-1");
    state = workflowReducer(state, { type: "SCAN_JUIST", onderdeelId: "l1-o1" });
    state = workflowReducer(state, { type: "BEVESTIG_AANTAL" });
    let lijn = state.lijnen.find((l) => l.id === "lijn-1")!;
    expect(lijn.onderdelen.find((o) => o.id === "l1-o1")!.status).toBe(
      "gereserveerd",
    );

    state = workflowReducer(state, { type: "ONGEDAAN_MAKEN", onderdeelId: "l1-o1" });
    lijn = state.lijnen.find((l) => l.id === "lijn-1")!;
    const onderdeel = lijn.onderdelen.find((o) => o.id === "l1-o1")!;
    expect(onderdeel.status).toBe("te_scannen");
    expect(onderdeel.genomenAantal).toBeUndefined();
    expect(state.activeOnderdeelId).toBe("l1-o1");
  });
});
