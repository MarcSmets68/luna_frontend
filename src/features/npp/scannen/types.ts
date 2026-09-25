// Local type surface for the NPP "Scannen / verifiëren" tile - narrows/
// re-exports the shared api-client types so components in this feature
// import from one local place instead of reaching into "@/lib/api-client"
// everywhere.
export type {
  ArtikelScanArticle,
  ArtikelScanCandidate,
  ArtikelScanResult,
} from "@/lib/api-client";
