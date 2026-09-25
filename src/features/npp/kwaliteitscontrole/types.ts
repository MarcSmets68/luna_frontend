// Local type surface for the NPP "Kwaliteitscontrole" tile - narrows/
// re-exports the shared api-client types so components in this feature
// import from one local place instead of reaching into "@/lib/api-client"
// everywhere (same convention as ../stockbeweging/types.ts).
export type {
  QcAnswerResult,
  QcChecklistItem,
  QcItemState,
  QcQueueItem,
  QcSession,
} from "@/lib/api-client";

export type KwaliteitscontroleStep = "queue" | "checklist" | "complete" | "rejected";

/** Brief auto-dismiss delay for the "complete"/"rejected" transition states. */
export const AUTO_RETURN_DELAY_MS = 1500;
