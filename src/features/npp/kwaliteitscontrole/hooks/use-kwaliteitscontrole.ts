"use client";

import { useEffect, useRef, useState } from "react";
import {
  answerKwaliteitscontroleItem,
  getKwaliteitscontroleQueue,
  rejectKwaliteitscontrole,
  startKwaliteitscontroleSession,
} from "@/lib/api-client";
import { getValidSession } from "@/features/auth/session";
import type {
  QcChecklistItem,
  QcItemState,
  QcQueueItem,
  QcSession,
} from "../types";
import { AUTO_RETURN_DELAY_MS } from "../types";
import type { KwaliteitscontroleStep } from "../types";

const SESSION_ERROR_MESSAGE = "Je sessie is verlopen of je bent niet ingelogd. Log opnieuw in.";

/**
 * Owns the full step machine for the NPP "Kwaliteitscontrole" tile:
 * queue -> checklist -> complete | rejected -> back to queue. Mirrors
 * use-stock-beweging.ts's shape (plain useState, session check before
 * every write) but adds a per-row (queue) and per-item (checklist)
 * granularity for loading/error state, since both the queue and the
 * checklist render lists rather than a single form.
 */
export function useKwaliteitscontrole() {
  const [step, setStep] = useState<KwaliteitscontroleStep>("queue");

  // Queue step.
  const [queue, setQueue] = useState<QcQueueItem[] | null>(null);
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [startingKey, setStartingKey] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);

  // Checklist step.
  const [session, setSession] = useState<QcSession | null>(null);
  const [savingLijnnr, setSavingLijnnr] = useState<number | null>(null);
  const [itemErrors, setItemErrors] = useState<Record<number, string>>({});

  // Afkeur (reject) dialog.
  const [afkeurDialogOpen, setAfkeurDialogOpen] = useState(false);
  const [afkeurSubmitting, setAfkeurSubmitting] = useState(false);
  const [afkeurError, setAfkeurError] = useState<string | null>(null);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function fetchQueue() {
    const sessionInfo = getValidSession();
    if (!sessionInfo) {
      setQueueError(SESSION_ERROR_MESSAGE);
      setQueue(null);
      return;
    }

    setQueueLoading(true);
    setQueueError(null);
    try {
      const data = await getKwaliteitscontroleQueue(sessionInfo.token);
      setQueue(data.items);
    } catch (e) {
      setQueueError(
        e instanceof Error ? e.message : "Er ging iets mis bij het ophalen van de wachtrij."
      );
      setQueue(null);
    } finally {
      setQueueLoading(false);
    }
  }

  useEffect(() => {
    fetchQueue();
  }, []);

  async function startSession(item: QcQueueItem) {
    const sessionInfo = getValidSession();
    if (!sessionInfo) {
      setStartError(SESSION_ERROR_MESSAGE);
      return;
    }

    const key = `${item.bonnr}-${item.groepnr}`;
    setStartingKey(key);
    setStartError(null);
    try {
      const data = await startKwaliteitscontroleSession(item.bonnr, item.groepnr, sessionInfo.token);
      setSession(data);
      setItemErrors({});
      setStep("checklist");
    } catch (e) {
      setStartError(
        e instanceof Error ? e.message : "Er ging iets mis bij het starten van de controle."
      );
    } finally {
      setStartingKey(null);
    }
  }

  async function answerItem(
    lijnnr: number,
    controle: Exclude<QcItemState, "Te controleren">,
    info?: string
  ) {
    if (!session) return;

    const sessionInfo = getValidSession();
    if (!sessionInfo) {
      setItemErrors((prev) => ({ ...prev, [lijnnr]: SESSION_ERROR_MESSAGE }));
      return;
    }

    setSavingLijnnr(lijnnr);
    setItemErrors((prev) => {
      const next = { ...prev };
      delete next[lijnnr];
      return next;
    });

    try {
      const payload = info !== undefined ? { controle, info } : { controle };
      const result = await answerKwaliteitscontroleItem(
        session.bonnr,
        session.groepnr,
        session.volgnr,
        lijnnr,
        payload,
        sessionInfo.token
      );

      setSession((prev) => {
        if (!prev) return prev;
        const items: QcChecklistItem[] = prev.items.map((it) =>
          it.lijnnr === lijnnr ? result.item : it
        );
        return { ...prev, items };
      });

      if (result.sessionComplete) {
        setStep("complete");
      }
    } catch (e) {
      setItemErrors((prev) => ({
        ...prev,
        [lijnnr]: e instanceof Error ? e.message : "Er ging iets mis bij het opslaan van dit item.",
      }));
    } finally {
      setSavingLijnnr(null);
    }
  }

  function openAfkeurDialog() {
    setAfkeurError(null);
    setAfkeurDialogOpen(true);
  }

  function closeAfkeurDialog() {
    if (afkeurSubmitting) return;
    setAfkeurDialogOpen(false);
    setAfkeurError(null);
  }

  async function submitAfkeur(opmerking: string) {
    if (!session) return;

    const sessionInfo = getValidSession();
    if (!sessionInfo) {
      setAfkeurError(SESSION_ERROR_MESSAGE);
      return;
    }

    setAfkeurSubmitting(true);
    setAfkeurError(null);
    try {
      await rejectKwaliteitscontrole(
        session.bonnr,
        session.groepnr,
        session.volgnr,
        { opmerking },
        sessionInfo.token
      );
      setAfkeurDialogOpen(false);
      setStep("rejected");
    } catch (e) {
      setAfkeurError(
        e instanceof Error ? e.message : "Er ging iets mis bij het afkeuren van deze controle."
      );
    } finally {
      setAfkeurSubmitting(false);
    }
  }

  // Auto-return to the queue from the brief "complete"/"rejected"
  // transition states, re-fetching so the just-finished bon/groep drops
  // out of the list. Cleans up the timeout on unmount/step change so a
  // stale timer never fires after the component is gone.
  useEffect(() => {
    if (step !== "complete" && step !== "rejected") return undefined;

    timeoutRef.current = setTimeout(() => {
      setSession(null);
      setItemErrors({});
      setStep("queue");
      fetchQueue();
    }, AUTO_RETURN_DELAY_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [step]);

  return {
    step,
    queue,
    queueLoading,
    queueError,
    startingKey,
    startError,
    startSession,
    session,
    savingLijnnr,
    itemErrors,
    answerItem,
    afkeurDialogOpen,
    afkeurSubmitting,
    afkeurError,
    openAfkeurDialog,
    closeAfkeurDialog,
    submitAfkeur,
    refetchQueue: fetchQueue,
  };
}
