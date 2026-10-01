"use client";

import { useEffect, useRef, useState } from "react";
import { getReservatieDetail, getReservatieQueue } from "@/lib/api-client";
import type {
  ReservatieDetail,
  ReservatieMode,
  ReservatieQueueItem,
} from "../types";

const QUEUE_FALLBACK_ERROR = "Er ging iets mis bij het ophalen van de reservaties.";
const DETAIL_FALLBACK_ERROR = "Er ging iets mis bij het ophalen van de bonlijnen.";

function errorMessage(e: unknown, fallback: string): string {
  return e instanceof Error ? e.message : fallback;
}

/**
 * Read-only state for the NPP "Reservaties raadplegen" tile: the queue
 * for the selected mode (fetch on mount, on mode switch and on refresh)
 * plus the bonlijn detail of one selected queue row. Responses of
 * superseded requests are ignored so a fast mode/row switch never shows
 * stale data.
 */
export function useReservaties() {
  const [mode, setModeState] = useState<ReservatieMode>("direct");
  const [items, setItems] = useState<ReservatieQueueItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<ReservatieQueueItem | null>(null);
  const [detail, setDetail] = useState<ReservatieDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const queueRequestId = useRef(0);
  const detailRequestId = useRef(0);

  function fetchQueue(nextMode: ReservatieMode) {
    const requestId = ++queueRequestId.current;
    return getReservatieQueue(nextMode).then(
      (data) => {
        if (requestId !== queueRequestId.current) return;
        setItems(data.items);
        setLoading(false);
      },
      (e) => {
        if (requestId !== queueRequestId.current) return;
        setError(errorMessage(e, QUEUE_FALLBACK_ERROR));
        setItems(null);
        setLoading(false);
      }
    );
  }

  function loadQueue(nextMode: ReservatieMode) {
    setLoading(true);
    setError(null);
    return fetchQueue(nextMode);
  }

  // Initial load: loading already starts as true, so no synchronous
  // setState is needed here; state is only set once the request settles.
  useEffect(() => {
    void fetchQueue("direct");
  }, []);

  function setMode(nextMode: ReservatieMode) {
    if (nextMode === mode) return;
    setModeState(nextMode);
    setItems(null);
    closeDetail();
    return loadQueue(nextMode);
  }

  function refresh() {
    return loadQueue(mode);
  }

  function openDetail(item: ReservatieQueueItem) {
    const requestId = ++detailRequestId.current;
    setSelected(item);
    setDetail(null);
    setDetailError(null);
    setDetailLoading(true);
    return getReservatieDetail(item.bonnr, item.groepnr).then(
      (data) => {
        if (requestId !== detailRequestId.current) return;
        setDetail(data);
        setDetailLoading(false);
      },
      (e) => {
        if (requestId !== detailRequestId.current) return;
        setDetailError(errorMessage(e, DETAIL_FALLBACK_ERROR));
        setDetailLoading(false);
      }
    );
  }

  function closeDetail() {
    detailRequestId.current++;
    setSelected(null);
    setDetail(null);
    setDetailError(null);
    setDetailLoading(false);
  }

  return {
    mode,
    setMode,
    items,
    loading,
    error,
    refresh,
    selected,
    detail,
    detailLoading,
    detailError,
    openDetail,
    closeDetail,
  };
}
