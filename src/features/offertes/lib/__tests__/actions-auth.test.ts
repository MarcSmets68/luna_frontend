// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cookieGet = vi.hoisted(() => vi.fn());
vi.mock("next/headers", () => ({ cookies: async () => ({ get: cookieGet }) }));
vi.mock("next/navigation", () => ({ redirect: vi.fn(), unstable_rethrow: vi.fn() }));

import { zoekArtikelenAction } from "../actions";

describe("zoekArtikelenAction - token forwarding", () => {
  beforeEach(() => {
    vi.stubEnv("API_BASE_URL", "http://backend/web");
    cookieGet.mockReturnValue({ name: "luna.auth.token", value: "cookie-token" });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("sends the cookie token on the backend calls made by the server action", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(async () => new Response(JSON.stringify({ items: [], hasMore: false }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await zoekArtikelenAction("LED");

    expect(fetchMock).toHaveBeenCalled();
    for (const [, init] of fetchMock.mock.calls) {
      expect(init.headers["X-Auth-Token"]).toBe("cookie-token");
    }
  });
});
