import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { KwaliteitscontroleView } from "../kwaliteitscontrole-view";
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
  ],
};

describe("KwaliteitscontroleView", () => {
  afterEach(() => {
    vi.resetAllMocks();
    clearSession();
  });

  it("shows the queue after fetching it", async () => {
    stubSession();
    mockedGetQueue.mockResolvedValue({ items: [queueItem] });
    render(<KwaliteitscontroleView />);

    await waitFor(() => expect(screen.getByText("Bon 1001 / 1")).toBeInTheDocument());
  });

  it("shows a login error and no queue when there is no valid session", async () => {
    render(<KwaliteitscontroleView />);

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Je sessie is verlopen of je bent niet ingelogd. Log opnieuw in."
      )
    );
    expect(mockedGetQueue).not.toHaveBeenCalled();
  });

  it("starts a session and shows the checklist on tap", async () => {
    stubSession();
    mockedGetQueue.mockResolvedValue({ items: [queueItem] });
    mockedStartSession.mockResolvedValue(session);
    const user = userEvent.setup();
    render(<KwaliteitscontroleView />);

    await waitFor(() => expect(screen.getByText("Bon 1001 / 1")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /Bon 1001/ }));

    await waitFor(() => expect(screen.getByText("Kleur controle")).toBeInTheDocument());
  });

  it("answers an item and shows the completion state when the session finishes", async () => {
    stubSession();
    mockedGetQueue.mockResolvedValue({ items: [queueItem] });
    mockedStartSession.mockResolvedValue(session);
    mockedAnswerItem.mockResolvedValue({
      item: { lijnnr: 10, omschr: "Kleur controle", swInfo: false, controle: "OK", info: "" },
      sessionComplete: true,
    });
    const user = userEvent.setup();
    render(<KwaliteitscontroleView />);

    await waitFor(() => expect(screen.getByText("Bon 1001 / 1")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /Bon 1001/ }));
    await waitFor(() => expect(screen.getByText("Kleur controle")).toBeInTheDocument());

    const group = screen.getByRole("group", { name: "Controle voor Kleur controle" });
    await user.click(within(group).getByRole("button", { name: "OK" }));

    await waitFor(() =>
      expect(screen.getByText("Alles gecontroleerd - wordt afgesloten...")).toBeInTheDocument()
    );
  });

  it("opens the afkeur dialog and rejects the session", async () => {
    stubSession();
    mockedGetQueue.mockResolvedValue({ items: [queueItem] });
    mockedStartSession.mockResolvedValue(session);
    mockedReject.mockResolvedValue({ outcome: "rejected", bonnr: 1001, groepnr: 1, volgnr: 1 });
    const user = userEvent.setup();
    render(<KwaliteitscontroleView />);

    await waitFor(() => expect(screen.getByText("Bon 1001 / 1")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /Bon 1001/ }));
    await waitFor(() => expect(screen.getByText("Kleur controle")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /Afkeuren/ }));
    expect(screen.getByText("Controle afkeuren")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Opmerking"), "Verkeerde kleur");
    await user.click(screen.getByRole("button", { name: "Bevestigen" }));

    await waitFor(() => expect(screen.getByText("Afgekeurd")).toBeInTheDocument());
    expect(mockedReject).toHaveBeenCalledWith(
      1001,
      1,
      1,
      { opmerking: "Verkeerde kleur" },
      "tok-1"
    );
  });

  it("keeps the queue visible and shows the error inline when starting a session fails", async () => {
    stubSession();
    mockedGetQueue.mockResolvedValue({ items: [queueItem] });
    mockedStartSession.mockRejectedValue(new Error("Al in bewerking door PIET"));
    const user = userEvent.setup();
    render(<KwaliteitscontroleView />);

    await waitFor(() => expect(screen.getByText("Bon 1001 / 1")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /Bon 1001/ }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Al in bewerking door PIET")
    );
    expect(screen.getByText("Bon 1001 / 1")).toBeInTheDocument();
  });
});
