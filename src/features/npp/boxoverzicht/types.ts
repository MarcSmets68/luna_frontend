// Local type surface for the NPP "Boxoverzicht" tile - narrows/re-exports
// the shared api-client types so components in this feature import from
// one local place instead of reaching into "@/lib/api-client" everywhere.
export type { BoxOverzichtArticle, BoxOverzichtResult } from "@/lib/api-client";
