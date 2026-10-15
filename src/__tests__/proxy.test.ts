import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { config, proxy } from "../proxy";

const req = () => new NextRequest("http://localhost:3000/dev-users");

describe("proxy", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("only runs for /dev-users", () => {
    expect(config.matcher).toEqual(["/dev-users", "/dev-users/:path*"]);
  });

  it("rewrites /dev-users to a non-existent route (404) in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const res = proxy(req());
    expect(res.headers.get("x-middleware-rewrite")).toContain("/_dev-users-disabled");
  });

  it("lets the request through outside production", () => {
    vi.stubEnv("NODE_ENV", "development");
    const res = proxy(req());
    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });
});
