// Barrel for the PASOE WebHandler client. The implementation lives per domain
// in `src/lib/api/` (shared HTTP layer in `src/lib/api/http.ts`); this file
// only re-exports it so existing imports keep working. Components must not
// call fetch() directly (see root AGENTS.md, frontend constraints).

export { ApiError } from "./api/http";
export * from "./api/auth";
export * from "./api/bestellingen";
export * from "./api/dashboard";
export * from "./api/dev-users";
export * from "./api/facturatie";
export * from "./api/klanten";
export * from "./api/lakproductie";
export * from "./api/leveranciers";
export * from "./api/npp";
export * from "./api/offertes";
export * from "./api/orders";
export * from "./api/pakbonnen";
export * from "./api/rapportage";
export * from "./api/voorraad";
