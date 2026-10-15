// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  get: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: m.get }) }));
vi.mock("next/navigation", () => ({ redirect: m.redirect, unstable_rethrow: vi.fn() }));

import { ApiError, request } from "../http";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

function mockFetch(response: Response) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}
const sentHeaders = (fetchMock: ReturnType<typeof vi.fn>) => fetchMock.mock.calls[0][1].headers;

describe("request - cookie token (server side)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("API_BASE_URL", "http://backend/web");
    m.get.mockReturnValue({ name: "luna.auth.token", value: "cookie-token" });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it.each(["GET", "POST", "PUT", "DELETE"] as const)(
    "sends the cookie token as X-Auth-Token on %s",
    async (method) => {
      const fetchMock = mockFetch(json({}));
      await request(method, "/klant", { body: {} });
      expect(m.get).toHaveBeenCalledWith("luna.auth.token");
      expect(sentHeaders(fetchMock)["X-Auth-Token"]).toBe("cookie-token");
    },
  );

  it("does not send the token (or read the cookie) for /login", async () => {
    const fetchMock = mockFetch(json({}));
    await request("POST", "/login", { body: {} });
    expect(sentHeaders(fetchMock)).not.toHaveProperty("X-Auth-Token");
    expect(m.get).not.toHaveBeenCalled();
  });

  it("lets an explicitly passed token win over the cookie", async () => {
    const fetchMock = mockFetch(json({}));
    await request("POST", "/logout", { body: {}, headers: { "X-Auth-Token": "explicit" } });
    expect(sentHeaders(fetchMock)["X-Auth-Token"]).toBe("explicit");
    expect(m.get).not.toHaveBeenCalled();
  });

  it("sends no token header when the cookie is missing or expired", async () => {
    m.get.mockReturnValue(undefined);
    const fetchMock = mockFetch(json({}));
    await request("GET", "/klant");
    expect(sentHeaders(fetchMock)).toEqual({ Accept: "application/json" });
  });

  it("sends no token header outside a request scope (cookies() throws)", async () => {
    m.get.mockImplementation(() => {
      throw new Error("`cookies` was called outside a request scope");
    });
    const fetchMock = mockFetch(json({}));
    await request("GET", "/klant");
    expect(sentHeaders(fetchMock)).toEqual({ Accept: "application/json" });
  });

  it("on a backend 401 with a cookie token, redirects to the session-expired route", async () => {
    mockFetch(json({ error: { message: "Ongeldige of verlopen sessie" } }, 401));
    await expect(request("GET", "/klant")).rejects.toThrow("NEXT_REDIRECT:/api/auth/session-expired");
    expect(m.redirect).toHaveBeenCalledWith("/api/auth/session-expired");
  });

  it("does not redirect on 401 from /login (wrong password) but throws an ApiError", async () => {
    mockFetch(json({ error: { message: "Ongeldige kode of wachtwoord" } }, 401));
    const error = await request("POST", "/login", { body: {} }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 401, message: "Ongeldige kode of wachtwoord" });
    expect(m.redirect).not.toHaveBeenCalled();
  });

  it("does not redirect on 401 when the token was passed explicitly (e.g. logout)", async () => {
    mockFetch(json({ error: { message: "nee" } }, 401));
    const error = await request("POST", "/logout", { body: {}, headers: { "X-Auth-Token": "t" } }).catch(
      (e: unknown) => e,
    );
    expect(error).toMatchObject({ status: 401 });
    expect(m.redirect).not.toHaveBeenCalled();
  });

  it("does not redirect on other errors", async () => {
    mockFetch(json({ error: { message: "boom" } }, 500));
    await expect(request("GET", "/klant")).rejects.toMatchObject({ status: 500 });
    expect(m.redirect).not.toHaveBeenCalled();
  });
});
