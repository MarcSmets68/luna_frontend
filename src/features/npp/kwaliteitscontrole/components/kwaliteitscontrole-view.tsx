"use client";

import { useKwaliteitscontrole } from "../hooks/use-kwaliteitscontrole";
import { QueueList } from "./queue-list";
import { ChecklistView } from "./checklist-view";
import { AfkeurDialog } from "./afkeur-dialog";
import { SessionCompleteState } from "./session-complete-state";
import { SessionRejectedState } from "./session-rejected-state";
import { KwaliteitscontroleErrorState } from "./kwaliteitscontrole-error-state";

/**
 * Top-level container for the NPP "Kwaliteitscontrole" tile. Owns no
 * state itself - the step machine (queue -> checklist -> complete |
 * rejected -> queue) lives in useKwaliteitscontrole.
 */
export function KwaliteitscontroleView() {
  const qc = useKwaliteitscontrole();

  return (
    <div className="flex h-full w-full flex-col gap-6 p-6 sm:p-8">
      <div>
        <h1 className="font-heading text-xl font-semibold text-foreground">
          Kwaliteitscontrole
        </h1>
        <p className="text-sm text-muted-foreground">
          Kies een bon/groep om de controle te starten
        </p>
      </div>

      {qc.step === "queue" && (
        <>
          {qc.queueError && <KwaliteitscontroleErrorState message={qc.queueError} />}
          {qc.startError && <KwaliteitscontroleErrorState message={qc.startError} />}
          <QueueList
            items={qc.queue}
            loading={qc.queueLoading}
            startingKey={qc.startingKey}
            onStart={qc.startSession}
          />
        </>
      )}

      {qc.step === "checklist" && qc.session && (
        <>
          <ChecklistView
            session={qc.session}
            savingLijnnr={qc.savingLijnnr}
            itemErrors={qc.itemErrors}
            onAnswer={qc.answerItem}
            onAfkeur={qc.openAfkeurDialog}
          />
          <AfkeurDialog
            open={qc.afkeurDialogOpen}
            submitting={qc.afkeurSubmitting}
            error={qc.afkeurError}
            onConfirm={qc.submitAfkeur}
            onCancel={qc.closeAfkeurDialog}
          />
        </>
      )}

      {qc.step === "complete" && <SessionCompleteState />}
      {qc.step === "rejected" && <SessionRejectedState />}
    </div>
  );
}
