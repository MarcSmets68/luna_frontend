"use client";

import { ChecklistItemRow } from "./checklist-item-row";
import { AfkeurButton } from "./afkeur-button";
import type { QcItemState, QcSession } from "../types";

/**
 * Renders the active session's checklist. Works identically for a fresh
 * session and a resumed one (session.resumed === true) - session.items
 * already carries the merged/previous state either way, nothing special
 * to render for "resumed".
 */
export function ChecklistView({
  session,
  savingLijnnr,
  itemErrors,
  onAnswer,
  onAfkeur,
}: {
  session: QcSession;
  savingLijnnr: number | null;
  itemErrors: Record<number, string>;
  onAnswer: (lijnnr: number, controle: Exclude<QcItemState, "Te controleren">, info?: string) => void;
  onAfkeur: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Bon {session.bonnr} / {session.groepnr}
          </h2>
          <p className="text-sm text-muted-foreground">
            {session.resumed ? "Sessie hervat" : "Nieuwe controle"}
          </p>
        </div>
        <AfkeurButton onClick={onAfkeur} />
      </div>

      <div className="flex flex-col gap-3">
        {session.items.map((item) => (
          <ChecklistItemRow
            key={item.lijnnr}
            item={item}
            saving={savingLijnnr === item.lijnnr}
            error={itemErrors[item.lijnnr] ?? null}
            onAnswer={(controle, info) => onAnswer(item.lijnnr, controle, info)}
          />
        ))}
      </div>
    </div>
  );
}
