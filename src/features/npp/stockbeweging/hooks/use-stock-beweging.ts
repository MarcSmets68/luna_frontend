"use client";

import { useState } from "react";
import { getArtikelScan, postStockBeweging } from "@/lib/api-client";
import { getValidSession } from "@/features/auth/session";
import type {
  ArtikelScanArticle,
  ArtikelScanResult,
  StockBewegingMovementType,
  StockBewegingPayload,
  StockBewegingResult,
  StockBewegingStep,
} from "../types";

/**
 * Owns the full step machine + form state for the NPP "Stockbeweging
 * boeken" tile: artikel (scan/resolve) -> form (movementType + fields) ->
 * confirm (mandatory summary, the only path that calls postStockBeweging)
 * -> result. Mirrors use-artikel-scan.ts's scan/loading/error pattern for
 * the article-selection step, plus a session check before every booking
 * attempt (this is the first NPP tile that mutates data).
 */
export function useStockBeweging() {
  const [step, setStep] = useState<StockBewegingStep>("artikel");

  // Article-selection step.
  const [scanResult, setScanResult] = useState<ArtikelScanResult | null>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Form step.
  const [movementType, setMovementType] = useState<StockBewegingMovementType | null>(null);
  const [aantal, setAantal] = useState("");
  const [opm, setOpm] = useState("");
  const [nieuwMagazijn, setNieuwMagazijn] = useState("");

  // Confirm/submit step.
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<StockBewegingResult | null>(null);

  const article: ArtikelScanArticle | null =
    scanResult?.status === "resolved" ? scanResult.article ?? null : null;

  async function submitScan(scan: string) {
    setScanLoading(true);
    setScanError(null);
    try {
      const data = await getArtikelScan(scan);
      setScanResult(data);
      if (data.status === "resolved" && data.article) {
        setStep("form");
      }
    } catch (e) {
      setScanError(
        e instanceof Error ? e.message : "Er ging iets mis bij het opzoeken van het artikel."
      );
      setScanResult(null);
    } finally {
      setScanLoading(false);
    }
  }

  function goToConfirm() {
    setSubmitError(null);
    setStep("confirm");
  }

  function goBackToForm() {
    setSubmitError(null);
    setStep("form");
  }

  async function confirmBooking() {
    if (!article || !movementType) return;

    const session = getValidSession();
    if (!session) {
      setSubmitError("Je sessie is verlopen of je bent niet ingelogd. Log opnieuw in.");
      return;
    }

    const payload: StockBewegingPayload = {
      artnr: article.artnr,
      movementType,
    };
    if (movementType === "transfer_intern") {
      payload.nieuwMagazijn = nieuwMagazijn.trim();
    } else {
      payload.aantal = Number(aantal);
      payload.opm = opm.trim();
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const data = await postStockBeweging(payload, session.token);
      setResult(data);
      setStep("result");
    } catch (e) {
      setSubmitError(
        e instanceof Error ? e.message : "Er ging iets mis bij het boeken van de stockbeweging."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setStep("artikel");
    setScanResult(null);
    setScanError(null);
    setMovementType(null);
    setAantal("");
    setOpm("");
    setNieuwMagazijn("");
    setSubmitError(null);
    setResult(null);
  }

  return {
    step,
    scanResult,
    scanLoading,
    scanError,
    submitScan,
    article,
    movementType,
    setMovementType,
    aantal,
    setAantal,
    opm,
    setOpm,
    nieuwMagazijn,
    setNieuwMagazijn,
    submitting,
    submitError,
    result,
    goToConfirm,
    goBackToForm,
    confirmBooking,
    reset,
  };
}
