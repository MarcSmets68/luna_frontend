import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Resolve "#api-runtime" to the browser-side adapter, as the client bundle does.
vi.mock("#api-runtime", async () => import("../api-runtime.client"));

import { request } from "../http";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

describe("request - browser (client layer)", () => {
  const assign = vi.fn();
  const originalLocation = window.location;

  beforeEach(() => {
    vi.stubEnv("API_BASE_URL", "http://backend/web");
    Object.defineProperty(window, "location", {
      value: { ...originalLocation, assign },
      configurable: true,
    });
    document.cookie = "luna.auth.user=%7B%7D; path=/";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    assign.mockReset();
    Object.defineProperty(window, "location", { value: originalLocation, configurable: true });
    document.cookie = "luna.auth.user=; Max-Age=0; path=/";
  });

  it("calls the same-origin proxy route, never the backend, without any token header", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await request("PUT", "/klant/12", { body: { naam: "x" } });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/backend/klant/12");
    expect(init.headers).toEqual({
      Accept: "application/json",
      "Content-Type": "application/json",
    });
  });

  it("on a 401 clears the readable user cookie, goes to /login and still throws an ApiError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(json({ error: { message: "Ongeldige of verlopen sessie" } }, 401)),
    );

    await expect(request("GET", "/klant")).rejects.toMatchObject({
      status: 401,
      message: "Ongeldige of verlopen sessie",
    });

    expect(assign).toHaveBeenCalledWith("/login");
    expect(document.cookie).not.toContain("luna.auth.user");
  });

  it("does not redirect on other errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(json({ error: { message: "boom" } }, 500)),
    );

    await expect(request("GET", "/klant")).rejects.toMatchObject({ status: 500 });

    expect(assign).not.toHaveBeenCalled();
  });
});
