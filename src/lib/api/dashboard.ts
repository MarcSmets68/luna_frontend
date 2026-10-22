import { request } from "./http";

export type DashboardStatCards = {
  openOffertesCount: number;
  openOffertesBedragPotentieel: number;
  ordersInProductieCount: number;
  ordersInProductieLeverenDezeWeek: number;
  omzetDezeMaand: number;
  omzetVsVorigeMaandPct: number | null;
  lageVoorraadCount: number;
};

export type DashboardActivityItem = {
  text: string;
  datum: string | null;
  type: "offerte" | "bon" | "factuur";
};

export type DashboardProductionItem = {
  bonnr: number;
  klant: string;
  leverdatum: string | null;
  bedrag: number;
  geparkeerd: boolean;
};

export type DashboardOmzetTrendItem = {
  month: number;
  year: number;
  label: string;
  total: number;
  isPartial: boolean;
};

export type DashboardTopKlantItem = {
  rang: number;
  klnr: number;
  naam: string;
  omzet: number;
  aantalFacturen: number;
  aandeelPct: number;
  omzetVorigeMaand: number;
  vsVorigeMaandPct: number | null;
};

export type DashboardTopArtikelItem = {
  rang: number;
  artnr: string;
  omschrijving: string;
  omzet: number;
  aantal: number;
  aandeelPct: number;
  omzetVorigeMaand: number;
  vsVorigeMaandPct: number | null;
};

export type DashboardResponse = {
  statCards: DashboardStatCards;
  recentActivity: DashboardActivityItem[];
  productionThisWeek: DashboardProductionItem[];
  omzetTrend: DashboardOmzetTrendItem[];
  topKlanten: DashboardTopKlantItem[];
  topKlantenError: boolean;
  topArtikelen: DashboardTopArtikelItem[];
  topArtikelenError: boolean;
};

/**
 * Dashboard summary: stat cards, recent activity and open orders due this
 * week - all derived server-side from offerte/bon/factuur/artikel (there is
 * no activity-log or production-stage table in the schema).
 *
 * Unlike every other `request` call, this one is deliberately cached for 60s
 * (`next.revalidate`) instead of `no-store`: the backend's "lage voorraad"
 * stat requires a full scan of ~1.8M `artikel` rows (no index on
 * stock/aantal/minv - see Luna.BusinessLogic.DashboardBE), which takes
 * ~45s. Without caching, every dashboard page load would pay that cost;
 * with it, only one request per minute does.
 * Backend: GET /web/dashboard (Luna.Web.DashboardHandler).
 */
export async function getDashboard(): Promise<DashboardResponse> {
  return request<DashboardResponse>("GET", "/dashboard", { next: { revalidate: 60 }, backendErrorMessages: false });
}

export type AiSearchFilter = {
  field: string;
  operator: "eq" | "prefix" | "contains" | "range";
  value: unknown;
};

export type AiSearchIntent = {
  entity: string;
  filters: AiSearchFilter[];
  aggregation: {
    type: "sum" | "avg" | "min" | "max" | "count";
    field: string;
  } | null;
  confidence: number;
} | null;

export type AiSearchResultType = "results" | "no_results" | "clarification";

/**
 * `items` is deliberately `Record<string, unknown>[]` rather than a typed
 * entity (BonItem/KlantItem/...) - the shape of each row depends on
 * `entity`, which is only known at runtime from the AI-derived intent.
 * Callers/components render columns dynamically from `Object.keys(item)`
 * instead of assuming a fixed shape.
 */
export type AiSearchResponse = {
  queryText: string;
  resultType: AiSearchResultType;
  entity: string | null;
  intent: AiSearchIntent;
  items: Record<string, unknown>[];
  page: number;
  pageSize: number;
  hasMore: boolean;
  summary: string | null;
  clarificationQuestion: string | null;
};

/**
 * Sends a free-text prompt to the AI search endpoint, which interprets it
 * into a query intent (entity + filters/aggregation) and returns either a
 * page of results, a "no_results" summary, or a clarification question
 * when the prompt is too ambiguous to resolve. Errors (502/500/network)
 * surface via `request`'s standard `{"error":{"message"}}` handling in http.ts.
 * Backend: POST /web/ai-search (Luna.Web.AiSearchHandler).
 */
export async function searchDashboardAi(
  prompt: string,
): Promise<AiSearchResponse> {
  return request<AiSearchResponse>("POST", "/ai-search", { body: { prompt } });
}
