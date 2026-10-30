import { describe, expect, it } from "vitest";
import { buildContentSecurityPolicy, buildSecurityHeaders } from "../security-headers";

const valueOf = (headers: { key: string; value: string }[], key: string) =>
  headers.find((header) => header.key === key)?.value;

describe("buildContentSecurityPolicy", () => {
  it("forbids framing, plugins and foreign base/form targets", () => {
    const csp = buildContentSecurityPolicy(true);
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain("connect-src 'self'");
  });

  it("only allows unsafe-eval outside production", () => {
    expect(buildContentSecurityPolicy(true)).not.toContain("'unsafe-eval'");
    expect(buildContentSecurityPolicy(false)).toContain("'unsafe-eval'");
  });

  it("upgrades insecure requests only in production", () => {
    expect(buildContentSecurityPolicy(true)).toContain("upgrade-insecure-requests");
    expect(buildContentSecurityPolicy(false)).not.toContain("upgrade-insecure-requests");
  });
});

describe("buildSecurityHeaders", () => {
  it("sets the baseline headers in every environment", () => {
    for (const isProduction of [true, false]) {
      const headers = buildSecurityHeaders(isProduction);
      expect(valueOf(headers, "X-Frame-Options")).toBe("DENY");
      expect(valueOf(headers, "X-Content-Type-Options")).toBe("nosniff");
      expect(valueOf(headers, "Referrer-Policy")).toBe("strict-origin-when-cross-origin");
      expect(valueOf(headers, "Permissions-Policy")).toContain("camera=()");
      expect(valueOf(headers, "Content-Security-Policy")).toBeTruthy();
    }
  });

  it("sends HSTS in production only", () => {
    expect(valueOf(buildSecurityHeaders(true), "Strict-Transport-Security")).toContain("max-age=");
    expect(valueOf(buildSecurityHeaders(false), "Strict-Transport-Security")).toBeUndefined();
  });
});
