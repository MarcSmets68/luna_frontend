export function withOverviewContext(detailHref: string, overviewHref: string, fallback: string) {
  if (overviewHref === fallback || overviewHref === `${fallback}?page=1`) return detailHref;
  const params = new URLSearchParams({ returnTo: overviewHref });
  return `${detailHref}?${params.toString()}`;
}

export function overviewReturnHref(value: unknown, fallback: string): string {
  if (typeof value !== "string" || !value.startsWith(`${fallback}?`)) return fallback;
  const url = new URL(value, "https://luna.invalid");
  return url.origin === "https://luna.invalid" && url.pathname === fallback
    ? `${url.pathname}${url.search}`
    : fallback;
}
