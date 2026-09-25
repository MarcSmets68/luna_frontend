// Local type surface for the NPP "Stockbeweging boeken" tile - narrows/
// re-exports the shared api-client types so components in this feature
// import from one local place instead of reaching into "@/lib/api-client"
// everywhere. Also re-exports the ArtikelScanArticle/Result types used
// for the article-selection step (shared with the "Scannen / verifiëren"
// tile at the api-client level only - feature folders stay decoupled).
export type {
  ArtikelScanArticle,
  ArtikelScanCandidate,
  ArtikelScanResult,
  StockBewegingMovementType,
  StockBewegingPayload,
  StockBewegingResult,
} from "@/lib/api-client";

import type { StockBewegingMovementType } from "@/lib/api-client";

export type StockBewegingStep = "artikel" | "form" | "confirm" | "result";

export const MOVEMENT_TYPES: StockBewegingMovementType[] = [
  "correctie_plus",
  "correctie_min",
  "correctie_gelijk",
  "ontvangst",
  "transfer_extern",
  "transfer_intern",
];

export const MOVEMENT_TYPE_LABELS: Record<StockBewegingMovementType, string> = {
  correctie_plus: "Correctie +",
  correctie_min: "Correctie -",
  correctie_gelijk: "Correctie =",
  ontvangst: "Ontvangst",
  transfer_extern: "Transfer extern",
  transfer_intern: "Transfer intern",
};
