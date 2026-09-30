import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ChecklistView } from "../checklist-view";
import type { QcSession } from "../../types";

const session: QcSession = {
  bonnr: 1001,
  groepnr: 1,
  volgnr: 1,
  datum: "2026-02-01",
  items: [
    { lijnnr: 10, omschr: "Kleur controle", swInfo: false, controle: "Te controleren", info: "" },
    { lijnnr: 20, omschr: "Bevestiging", swInfo: true, controle: "Te controleren", info: "" },
  ],
};

describe("ChecklistView", () => {
  it("renders the bon/groep heading and every checklist item", () => {
    render(
      <ChecklistView
        session={session}
        savingLijnnr={null}
        itemErrors={{}}
        onAnswer={() => {}}
        onAfkeur={() => {}}
      />
    );

    expect(screen.getByText("Bon 1001 / 1")).toBeInTheDocument();
    expect(screen.getByText("Kleur controle")).toBeInTheDocument();
    expect(screen.getByText("Bevestiging")).toBeInTheDocument();
    expect(screen.getByText("Nieuwe controle")).toBeInTheDocument();
  });

  it("shows a resumed indicator when session.resumed is true", () => {
    render(
      <ChecklistView
        session={{ ...session, resumed: true }}
        savingLijnnr={null}
        itemErrors={{}}
        onAnswer={() => {}}
        onAfkeur={() => {}}
      />
    );
    expect(screen.getByText("Sessie hervat")).toBeInTheDocument();
  });

  it("forwards the lijnnr to onAnswer for the tapped row", async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();
    render(
      <ChecklistView
        session={session}
        savingLijnnr={null}
        itemErrors={{}}
        onAnswer={onAnswer}
        onAfkeur={() => {}}
      />
    );

    const kleurGroup = screen.getByRole("group", { name: "Controle voor Kleur controle" });
    await user.click(within(kleurGroup).getByRole("button", { name: "N.v.t." }));
    expect(onAnswer).toHaveBeenCalledWith(10, "N.v.t.", undefined);
  });

  it("calls onAfkeur when the Afkeuren button is tapped", async () => {
    const user = userEvent.setup();
    const onAfkeur = vi.fn();
    render(
      <ChecklistView
        session={session}
        savingLijnnr={null}
        itemErrors={{}}
        onAnswer={() => {}}
        onAfkeur={onAfkeur}
      />
    );

    await user.click(screen.getByRole("button", { name: /Afkeuren/ }));
    expect(onAfkeur).toHaveBeenCalled();
  });

  it("shows the per-item error for the matching lijnnr only", () => {
    render(
      <ChecklistView
        session={session}
        savingLijnnr={null}
        itemErrors={{ 10: "Sessie is niet meer geldig" }}
        onAnswer={() => {}}
        onAfkeur={() => {}}
      />
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Sessie is niet meer geldig");
  });
});
