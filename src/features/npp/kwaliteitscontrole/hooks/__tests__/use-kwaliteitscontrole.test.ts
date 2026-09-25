import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useKwaliteitscontrole } from "../use-kwaliteitscontrole";
import {
  answerKwaliteitscontroleItem,
  getKwaliteitscontroleQueue,
  rejectKwaliteitscontrole,
  startKwaliteitscontroleSession,
} from "@/lib/api-client";
import { saveSession, clearSession } from "@/features/auth/session";

vi.mock("@/lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-client")>("@/lib/api-client");
  return {
    ...actual,
    getKwaliteitscontroleQueue: vi.fn(),
    startKwaliteitscontroleSession: vi.fn(),
    answerKwaliteitscontroleItem: vi.fn(),
    rejectKwaliteitscontrole: vi.fn(),
  };
});

const mockedGetQueue = vi.mocked(getKwaliteitscontroleQueue);
const mockedStartSession = vi.mocked(startKwaliteitscontroleSession);
const mockedAnswerItem = vi.mocked(answerKwaliteitscontroleItem);
const mockedReject = vi.mocked(rejectKwaliteitscontrole);

function stubSession() {
  saveSession({
    token: "tok-1",
    kode: "MARC",
    naam: "Marc",
    niveau: 1,
    everyoneAdminActive: false,
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  });
}

const queueItem = {
  bonnr: 1001,
  groepnr: 1,
  lijnnr: 10,
  klant: "Jansen",
  profielgroep: "PG1",
  montageDatum: "2026-02-01",
  hasInProgressSession: false,
  inProgressByOther: false,
};

const session = {
  bonnr: 1001,
  groepnr: 1,
  volgnr: 1,
  datum: "2026-02-01",
  items: [
    { lijnnr: 10, omschr: "Kleur controle", swInfo: false, controle: "Te controleren" as const, info: "" },
    { lijnnr: 20, omschr: "Bevestiging", swInfo: true, controle: "Te controleren" as const, info: "" },
  ],
};

describe("useKwaliteitscontrole", () => {
  beforeEach(() => {
    stubSession();
  });

  afterEach(() => {
    vi.resetAllMocks();
    clearSession();
    vi.useRealTimers();
  });

  it("shows a login message and does not fetch when there is no valid session", async () => {
    clearSession();
    const { result } = renderHook(() => useKwaliteitscontrole());

    await waitFor(() =>
      expect(result.current.queueError).toBe(
        "Je sessie is verlopen of je bent niet ingelogd. Log opnieuw in."
      )
    );
    expect(mockedGetQueue).not.toHaveBeenCalled();
  });

  it("fetches the queue on mount when the session is valid", async () => {
    mockedGetQueue.mockResolvedValue({ items: [queueItem] });
    const { result } = renderHook(() => useKwaliteitscontrole());

    await waitFor(() => expect(result.current.queue).toEqual([queueItem]));
    expect(mockedGetQueue).toHaveBeenCalledWith("tok-1");
  });

  it("starts a session and transitions to the checklist step", async () => {
    mockedGetQueue.mockResolvedValue({ items: [queueItem] });
    mockedStartSession.mockResolvedValue(session);
    const { result } = renderHook(() => useKwaliteitscontrole());
    await waitFor(() => expect(result.current.queue).toEqual([queueItem]));

    await act(async () => {
      await result.current.startSession(queueItem);
    });

    expect(mockedStartSession).toHaveBeenCalledWith(1001, 1, "tok-1");
    expect(result.current.step).toBe("checklist");
    expect(result.current.session).toEqual(session);
  });

  it("keeps the queue visible and shows the error inline on a 409 conflict", async () => {
    mockedGetQueue.mockResolvedValue({ items: [queueItem] });
    mockedStartSession.mockRejectedValue(new Error("Al in bewerking door PIET"));
    const { result } = renderHook(() => useKwaliteitscontrole());
    await waitFor(() => expect(result.current.queue).toEqual([queueItem]));

    await act(async () => {
      await result.current.startSession(queueItem);
    });

    expect(result.current.step).toBe("queue");
    expect(result.current.startError).toBe("Al in bewerking door PIET");
  });

  it("answers a non-swInfo item immediately and updates the item on success", async () => {
    mockedGetQueue.mockResolvedValue({ items: [queueItem] });
    mockedStartSession.mockResolvedValue(session);
    const answered = {
      item: { lijnnr: 10, omschr: "Kleur controle", swInfo: false, controle: "OK" as const, info: "" },
      sessionComplete: false,
    };
    mockedAnswerItem.mockResolvedValue(answered);

    const { result } = renderHook(() => useKwaliteitscontrole());
    await waitFor(() => expect(result.current.queue).toEqual([queueItem]));
    await act(async () => {
      await result.current.startSession(queueItem);
    });

    await act(async () => {
      await result.current.answerItem(10, "OK");
    });

    expect(mockedAnswerItem).toHaveBeenCalledWith(1001, 1, 1, 10, { controle: "OK" }, "tok-1");
    expect(result.current.session?.items.find((i) => i.lijnnr === 10)?.controle).toBe("OK");
    expect(result.current.step).toBe("checklist");
  });

  it("sends info for a swInfo item and transitions to complete when sessionComplete is true", async () => {
    mockedGetQueue.mockResolvedValue({ items: [queueItem] });
    mockedStartSession.mockResolvedValue(session);
    mockedAnswerItem.mockResolvedValue({
      item: { lijnnr: 20, omschr: "Bevestiging", swInfo: true, controle: "OK", info: "Gecontroleerd" },
      sessionComplete: true,
    });

    const { result } = renderHook(() => useKwaliteitscontrole());
    await waitFor(() => expect(result.current.queue).toEqual([queueItem]));
    await act(async () => {
      await result.current.startSession(queueItem);
    });

    await act(async () => {
      await result.current.answerItem(20, "OK", "Gecontroleerd");
    });

    expect(mockedAnswerItem).toHaveBeenCalledWith(
      1001,
      1,
      1,
      20,
      { controle: "OK", info: "Gecontroleerd" },
      "tok-1"
    );
    expect(result.current.step).toBe("complete");
  });

  it("stores a per-item error without dropping the rest of the session on failure", async () => {
    mockedGetQueue.mockResolvedValue({ items: [queueItem] });
    mockedStartSession.mockResolvedValue(session);
    mockedAnswerItem.mockRejectedValue(new Error("Sessie is niet meer geldig"));

    const { result } = renderHook(() => useKwaliteitscontrole());
    await waitFor(() => expect(result.current.queue).toEqual([queueItem]));
    await act(async () => {
      await result.current.startSession(queueItem);
    });

    await act(async () => {
      await result.current.answerItem(10, "Fout");
    });

    expect(result.current.itemErrors[10]).toBe("Sessie is niet meer geldig");
    expect(result.current.step).toBe("checklist");
    expect(result.current.session).not.toBeNull();
  });

  it("rejects the session and auto-returns to the queue after the delay", async () => {
    mockedGetQueue.mockResolvedValue({ items: [queueItem] });
    mockedStartSession.mockResolvedValue(session);
    mockedReject.mockResolvedValue({ outcome: "rejected", bonnr: 1001, groepnr: 1, volgnr: 1 });

    const { result } = renderHook(() => useKwaliteitscontrole());
    await waitFor(() => expect(result.current.queue).toEqual([queueItem]));
    await act(async () => {
      await result.current.startSession(queueItem);
    });

    act(() => {
      result.current.openAfkeurDialog();
    });
    expect(result.current.afkeurDialogOpen).toBe(true);

    vi.useFakeTimers();
    mockedGetQueue.mockResolvedValue({ items: [] });

    await act(async () => {
      await result.current.submitAfkeur("Verkeerde kleur");
    });

    expect(mockedReject).toHaveBeenCalledWith(
      1001,
      1,
      1,
      { opmerking: "Verkeerde kleur" },
      "tok-1"
    );
    expect(result.current.step).toBe("rejected");
    expect(result.current.afkeurDialogOpen).toBe(false);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });

    expect(result.current.step).toBe("queue");
    expect(result.current.queue).toEqual([]);
  });
});
