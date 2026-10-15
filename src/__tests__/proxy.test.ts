import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { config, proxy } from "../proxy";

const req = (path: string, cookie?: string) =>
  new NextRequest(`http://localhost:3000${path}`, cookie ? { headers: { cookie } } : undefined);

const matches = (path: string) => new RegExp(`^${config.matcher[0]}$`).test(path);

describe("proxy", () => {
  afterEach(() => vi.unstubAllEnvs());

  describe("/dev-users", () => {
    it("rewrites to a non-existent route (404) in production, even with a session", () => {
      vi.stubEnv("NODE_ENV", "production");
      const res = proxy(req("/dev-users", "luna.auth.token=abc"));
      expect(res.headers.get("x-middleware-rewrite")).toContain("/_dev-users-disabled");
    });

    it("is not rewritten outside production", () => {
      vi.stubEnv("NODE_ENV", "development");
      const res = proxy(req("/dev-users", "luna.auth.token=abc"));
      expect(res.headers.get("x-middleware-rewrite")).toBeNull();
      expect(res.headers.get("x-middleware-next")).toBe("1");
    });
  });

  describe("session cookie", () => {
    it("redirects to /login when the token cookie is missing", () => {
      const res = proxy(req("/klanten?page=2"));
      expect(res.status).toBe(307);
      expect(new URL(res.headers.get("location")!).pathname).toBe("/login");
      expect(new URL(res.headers.get("location")!).search).toBe("");
    });

    it("redirects the dashboard too", () => {
      expect(proxy(req("/")).headers.get("location")).toContain("/login");
    });

    it("lets requests through when the token cookie is present", () => {
      const res = proxy(req("/klanten", "luna.auth.token=abc"));
      expect(res.headers.get("x-middleware-next")).toBe("1");
      expect(res.headers.get("location")).toBeNull();
    });

    it("never redirects /login itself", () => {
      const res = proxy(req("/login"));
      expect(res.headers.get("x-middleware-next")).toBe("1");
    });

    it("does not treat the readable user cookie as a session", () => {
      const res = proxy(req("/klanten", "luna.auth.user=%7B%7D"));
      expect(res.headers.get("location")).toContain("/login");
    });
  });

  describe("matcher", () => {
    it.each(["/", "/klanten", "/orders/123", "/login", "/dev-users"])("covers %s", (path) => {
      expect(matches(path)).toBe(true);
    });

    it.each(["/api/backend/klant", "/api/auth/session-expired", "/_next/static/chunks/a.js", "/_next/image", "/favicon.ico", "/logo.png"])(
      "skips %s",
      (path) => {
        expect(matches(path)).toBe(false);
      },
    );
  });
});
