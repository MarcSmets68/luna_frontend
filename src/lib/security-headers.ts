// Security response headers for every route (wired up in next.config.ts).
//
// CSP notes:
// - The app loads nothing from third parties (next/font/google self-hosts the
//   font at build time) and talks to the backend only through the same-origin
//   /api/backend proxy, so everything can stay on 'self'.
// - `script-src` still needs 'unsafe-inline' because Next.js emits inline
//   bootstrap scripts and this CSP is static (no per-request nonce). Moving to
//   a nonce-based CSP in src/proxy.ts would allow dropping it; until then the
//   other directives (frame-ancestors, object-src, base-uri, form-action,
//   connect-src) still do most of the work.
// - 'unsafe-eval' is only added in development (React/Next dev tooling).
// - blob:/data: in img-src cover generated PDFs, barcodes and inline SVGs.

type Header = { key: string; value: string };

export function buildContentSecurityPolicy(isProduction: boolean): string {
  const scriptSrc = ["'self'", "'unsafe-inline'", ...(isProduction ? [] : ["'unsafe-eval'"])];

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": scriptSrc,
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'", "data:"],
    "connect-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };

  const policy = Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(" ")}`)
    .join("; ");

  return isProduction ? `${policy}; upgrade-insecure-requests` : policy;
}

export function buildSecurityHeaders(isProduction: boolean): Header[] {
  const headers: Header[] = [
    { key: "Content-Security-Policy", value: buildContentSecurityPolicy(isProduction) },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    },
  ];

  // HSTS only in production: on plain-http localhost it would stick in the
  // browser and break local development.
  if (isProduction) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains",
    });
  }

  return headers;
}
