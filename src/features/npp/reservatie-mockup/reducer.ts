import { createMockLijnen } from "./mock-data";
import {
  CorrectieReden,
  LogEntry,
  MAX_SCAN_POGINGEN,
  MockLijn,
  MockOnderdeel,
} from "./types";

export interface WorkflowState {
  lijnen: MockLijn[];
  activeLijnId: string | null;
  activeOnderdeelId: string | null;
  pogingen: number;
  foutmelding: string | null;
  leidinggevendeVerwittigd: boolean;
  aantal: number | null;
  tekortDialogOpen: boolean;
  tellenDialogOpen: boolean;
  log: LogEntry[];
}

export type WorkflowAction =
  | { type: "SELECT_LIJN"; lijnId: string }
  | { type: "SLUIT_LIJN" }
  | { type: "SCAN_JUIST"; onderdeelId: string }
  | { type: "SCAN_FOUT"; omschrijving: string }
  | { type: "ACK_LEIDINGGEVENDE" }
  | { type: "SET_AANTAL"; aantal: number }
  | { type: "BEVESTIG_AANTAL" }
  | { type: "ONGEDAAN_MAKEN"; onderdeelId: string }
  | { type: "FYSIEK_AANWEZIG"; aanwezig: boolean }
  | { type: "SLUIT_TEKORT_DIALOG" }
  | {
      type: "BEVESTIG_TELLING";
      geteld: number;
      reden: CorrectieReden;
      toelichting?: string;
    }
  | { type: "NAAR_PRODUCTIELIJST" }
  | { type: "SCAN_OPEN_ONDERDEEL"; lijnId: string; onderdeelId: string }
  | { type: "AFROND_PRODUCTIE"; lijnId: string };

export const OPERATOR = "Operator (mockup)";

export function isVerwerkt(status: MockOnderdeel["status"]): boolean {
  return (
    status === "gereserveerd" ||
    status === "open" ||
    status === "wacht_op_materiaal"
  );
}

export function alleOnderdelenVerwerkt(lijn: MockLijn): boolean {
  return lijn.onderdelen.every((o) => isVerwerkt(o.status));
}

export function heeftOpenOnderdelen(lijn: MockLijn): boolean {
  return lijn.onderdelen.some(
    (o) => o.status === "open" || o.status === "wacht_op_materiaal",
  );
}

function makeLog(wie: string, wat: string): LogEntry {
  return {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toLocaleTimeString("nl-BE", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    wie,
    wat,
  };
}

function updateLijn(
  lijnen: MockLijn[],
  lijnId: string,
  fn: (lijn: MockLijn) => MockLijn,
): MockLijn[] {
  return lijnen.map((l) => (l.id === lijnId ? fn(l) : l));
}

function updateOnderdeel(
  lijn: MockLijn,
  onderdeelId: string,
  fn: (o: MockOnderdeel) => MockOnderdeel,
): MockLijn {
  return {
    ...lijn,
    onderdelen: lijn.onderdelen.map((o) =>
      o.id === onderdeelId ? fn(o) : o,
    ),
  };
}

function nextTeScannen(lijn: MockLijn, afterId: string | null): string | null {
  const next = lijn.onderdelen.find(
    (o) => o.id !== afterId && o.status === "te_scannen",
  );
  return next ? next.id : null;
}

export function createInitialState(): WorkflowState {
  return {
    lijnen: createMockLijnen(),
    activeLijnId: null,
    activeOnderdeelId: null,
    pogingen: 0,
    foutmelding: null,
    leidinggevendeVerwittigd: false,
    aantal: null,
    tekortDialogOpen: false,
    tellenDialogOpen: false,
    log: [],
  };
}

export function workflowReducer(
  state: WorkflowState,
  action: WorkflowAction,
): WorkflowState {
  switch (action.type) {
    case "SELECT_LIJN": {
      const lijn = state.lijnen.find((l) => l.id === action.lijnId);
      if (!lijn) return state;
      const firstTeScannen = lijn.onderdelen.find(
        (o) => o.status === "te_scannen",
      );
      return {
        ...state,
        activeLijnId: action.lijnId,
        activeOnderdeelId: firstTeScannen ? firstTeScannen.id : null,
        pogingen: 0,
        foutmelding: null,
        leidinggevendeVerwittigd: false,
        aantal: null,
        tekortDialogOpen: false,
        tellenDialogOpen: false,
      };
    }

    case "SLUIT_LIJN":
      return {
        ...state,
        activeLijnId: null,
        activeOnderdeelId: null,
        pogingen: 0,
        foutmelding: null,
        leidinggevendeVerwittigd: false,
        aantal: null,
      };

    case "SCAN_JUIST": {
      const lijn = state.lijnen.find((l) => l.id === state.activeLijnId);
      const onderdeel = lijn?.onderdelen.find(
        (o) => o.id === action.onderdeelId,
      );
      if (!lijn || !onderdeel) return state;
      return {
        ...state,
        activeOnderdeelId: onderdeel.id,
        pogingen: 0,
        foutmelding: null,
        aantal: onderdeel.benodigd,
        log: [
          ...state.log,
          makeLog(
            OPERATOR,
            `Scan OK: ${onderdeel.artikelcode} (${onderdeel.omschrijving})`,
          ),
        ],
      };
    }

    case "SCAN_FOUT": {
      const pogingen = state.pogingen + 1;
      const geblokkeerd = pogingen >= MAX_SCAN_POGINGEN;
      return {
        ...state,
        pogingen,
        leidinggevendeVerwittigd: geblokkeerd,
        foutmelding: geblokkeerd
          ? "Leidinggevende verwittigd na 3 mislukte scanpogingen."
          : `Verkeerd onderdeel gescand (${action.omschrijving}). Poging ${pogingen} van ${MAX_SCAN_POGINGEN}.`,
        log: [
          ...state.log,
          makeLog(
            OPERATOR,
            geblokkeerd
              ? "3 mislukte scans - leidinggevende verwittigd"
              : `Foutscan: ${action.omschrijving} (poging ${pogingen}/${MAX_SCAN_POGINGEN})`,
          ),
        ],
      };
    }

    case "ACK_LEIDINGGEVENDE":
      return {
        ...state,
        pogingen: 0,
        leidinggevendeVerwittigd: false,
        foutmelding: null,
      };

    case "SET_AANTAL":
      return { ...state, aantal: Math.max(0, action.aantal) };

    case "BEVESTIG_AANTAL": {
      const lijn = state.lijnen.find((l) => l.id === state.activeLijnId);
      const onderdeel = lijn?.onderdelen.find(
        (o) => o.id === state.activeOnderdeelId,
      );
      if (!lijn || !onderdeel || state.aantal === null) return state;
      const aantal = state.aantal;

      if (aantal > onderdeel.stock) {
        // Insufficient stock - branch into the shortage dialog.
        return { ...state, tekortDialogOpen: true };
      }

      const bijgewerkteLijn = updateOnderdeel(lijn, onderdeel.id, (o) => ({
        ...o,
        status: "gereserveerd",
        genomenAantal: aantal,
        stock: o.stock - aantal,
      }));
      const nextId = nextTeScannen(bijgewerkteLijn, onderdeel.id);

      return {
        ...state,
        lijnen: updateLijn(state.lijnen, lijn.id, () => bijgewerkteLijn),
        activeOnderdeelId: nextId,
        aantal: null,
        pogingen: 0,
        foutmelding: null,
        log: [
          ...state.log,
          makeLog(
            OPERATOR,
            `Bevestigd: ${onderdeel.artikelcode} x${aantal} gereserveerd`,
          ),
        ],
      };
    }

    case "ONGEDAAN_MAKEN": {
      const lijn = state.lijnen.find((l) => l.id === state.activeLijnId);
      const onderdeel = lijn?.onderdelen.find(
        (o) => o.id === action.onderdeelId,
      );
      if (!lijn || !onderdeel) return state;
      const genomen = onderdeel.genomenAantal ?? 0;
      const bijgewerkteLijn = updateOnderdeel(lijn, onderdeel.id, (o) => ({
        ...o,
        status: "te_scannen",
        genomenAantal: undefined,
        stock: o.stock + genomen,
      }));
      return {
        ...state,
        lijnen: updateLijn(state.lijnen, lijn.id, () => bijgewerkteLijn),
        activeOnderdeelId: onderdeel.id,
        aantal: null,
        log: [
          ...state.log,
          makeLog(
            OPERATOR,
            `Bevestiging ongedaan gemaakt: ${onderdeel.artikelcode}`,
          ),
        ],
      };
    }

    case "FYSIEK_AANWEZIG": {
      const lijn = state.lijnen.find((l) => l.id === state.activeLijnId);
      const onderdeel = lijn?.onderdelen.find(
        (o) => o.id === state.activeOnderdeelId,
      );
      if (!lijn || !onderdeel) return state;

      if (action.aanwezig) {
        return { ...state, tekortDialogOpen: false, tellenDialogOpen: true };
      }

      if (onderdeel.uitstelbaar) {
        const bijgewerkteLijn = updateOnderdeel(lijn, onderdeel.id, (o) => ({
          ...o,
          status: "open",
          verwachteLevering: o.verwachteLevering ?? "Volgende levering",
        }));
        const nextId = nextTeScannen(bijgewerkteLijn, onderdeel.id);
        return {
          ...state,
          lijnen: updateLijn(state.lijnen, lijn.id, () => bijgewerkteLijn),
          activeOnderdeelId: nextId,
          aantal: null,
          tekortDialogOpen: false,
          log: [
            ...state.log,
            makeLog(
              OPERATOR,
              `${onderdeel.artikelcode}: niet aanwezig, uitstelbaar -> Open (reservatie blijft open)`,
            ),
          ],
        };
      }

      const bijgewerkteLijn = updateOnderdeel(lijn, onderdeel.id, (o) => ({
        ...o,
        status: "wacht_op_materiaal",
      }));
      const metStatus: MockLijn = {
        ...bijgewerkteLijn,
        status: "wacht_op_materiaal",
      };
      const nextId = nextTeScannen(metStatus, onderdeel.id);
      return {
        ...state,
        lijnen: updateLijn(state.lijnen, lijn.id, () => metStatus),
        activeOnderdeelId: nextId,
        aantal: null,
        tekortDialogOpen: false,
        log: [
          ...state.log,
          makeLog(
            OPERATOR,
            `${onderdeel.artikelcode}: niet aanwezig, niet uitstelbaar -> Wacht op materiaal, planner verwittigd`,
          ),
        ],
      };
    }

    case "SLUIT_TEKORT_DIALOG":
      return { ...state, tekortDialogOpen: false };

    case "BEVESTIG_TELLING": {
      const lijn = state.lijnen.find((l) => l.id === state.activeLijnId);
      const onderdeel = lijn?.onderdelen.find(
        (o) => o.id === state.activeOnderdeelId,
      );
      if (!lijn || !onderdeel) return state;
      const verschil = action.geteld - onderdeel.stock;
      const bijgewerkteLijn = updateOnderdeel(lijn, onderdeel.id, (o) => ({
        ...o,
        status: "gecorrigeerd",
        stock: action.geteld,
      }));
      const grootAfwijking =
        Math.abs(verschil) > 10 ||
        Math.abs(verschil) / Math.max(onderdeel.stock, 1) > 0.2;
      return {
        ...state,
        lijnen: updateLijn(state.lijnen, lijn.id, () => bijgewerkteLijn),
        tellenDialogOpen: false,
        log: [
          ...state.log,
          makeLog(
            OPERATOR,
            `Telling gecorrigeerd: ${onderdeel.artikelcode} van ${onderdeel.stock} naar ${action.geteld} (${verschil >= 0 ? "+" : ""}${verschil}), reden: ${action.reden}${action.toelichting ? ` - ${action.toelichting}` : ""}${grootAfwijking ? " [grote afwijking - tweede goedkeuring aangevraagd]" : ""}`,
          ),
        ],
      };
    }

    case "NAAR_PRODUCTIELIJST": {
      const lijn = state.lijnen.find((l) => l.id === state.activeLijnId);
      if (!lijn || !alleOnderdelenVerwerkt(lijn)) return state;
      const status = heeftOpenOnderdelen(lijn) ? "gereed (met open delen)" : "gereed";
      return {
        ...state,
        lijnen: updateLijn(state.lijnen, lijn.id, (l) => ({
          ...l,
          status: "gereed",
        })),
        activeLijnId: null,
        activeOnderdeelId: null,
        log: [
          ...state.log,
          makeLog(
            OPERATOR,
            `Bon ${lijn.bonnr} naar productielijst (${status === "gereed" ? "volledig gereserveerd" : "met open onderdelen"})`,
          ),
        ],
      };
    }

    case "SCAN_OPEN_ONDERDEEL": {
      const lijn = state.lijnen.find((l) => l.id === action.lijnId);
      const onderdeel = lijn?.onderdelen.find(
        (o) => o.id === action.onderdeelId,
      );
      if (!lijn || !onderdeel) return state;
      const bijgewerkteLijn = updateOnderdeel(lijn, onderdeel.id, (o) => ({
        ...o,
        status: "gereserveerd",
        genomenAantal: o.benodigd,
      }));
      return {
        ...state,
        lijnen: updateLijn(state.lijnen, lijn.id, () => bijgewerkteLijn),
        log: [
          ...state.log,
          makeLog(
            OPERATOR,
            `Open onderdeel ${onderdeel.artikelcode} gescand en toegevoegd - reservatie gesloten`,
          ),
        ],
      };
    }

    case "AFROND_PRODUCTIE": {
      const lijn = state.lijnen.find((l) => l.id === action.lijnId);
      if (!lijn || heeftOpenOnderdelen(lijn)) return state;
      return {
        ...state,
        lijnen: updateLijn(state.lijnen, lijn.id, (l) => ({
          ...l,
          status: "afgerond",
        })),
        log: [
          ...state.log,
          makeLog(OPERATOR, `Bon ${lijn.bonnr}: productie afgerond`),
        ],
      };
    }

    default:
      return state;
  }
}
