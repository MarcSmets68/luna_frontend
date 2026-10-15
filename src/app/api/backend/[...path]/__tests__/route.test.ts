// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, GET, POST, PUT } from "../route";

const BACKEND = "http://backend/web";

function request(path: string, init: { method?: string; body?: string; headers?: Record<string, string> } = {}) {
  return new NextRequest(`http://localhost:3000/api/backend${path}`, {
    method: init.method ?? "GET",
    body: init.body,
    headers: { host: "localhost:3000", ...init.headers },
  });
}

const upstreamJson = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("/api/backend proxy route", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.stubEnv("API_BASE_URL", BACKEND);
    fetchMock = vi.fn().mockImplementation(async () => upstreamJson({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  const sent = () => fetchMock.mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }];

  it("forwards GET with the path, query string and the cookie token as X-Auth-Token", async () => {
    const res = await GET(request("/klant?page=1&naam=a%20b", { headers: { cookie: "luna.auth.token=abc" } }));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
    const [url, init] = sent();
    expect(url).toBe(`${BACKEND}/klant?page=1&naam=a%20b`);
    expect(init.method).toBe("GET");
    expect(init.headers["X-Auth-Token"]).toBe("abc");
    expect(init.cache).toBe("no-store");
  });

  it("keeps percent-encoded path segments intact", async () => {
    await GET(request("/artikel/a%2Fb%25", { headers: { cookie: "luna.auth.token=abc" } }));
    expect(sent()[0]).toBe(`${BACKEND}/artikel/a%2Fb%25`);
  });

  it.each([
    ["POST", POST],
    ["PUT", PUT],
    ["DELETE", DELETE],
  ] as const)("forwards %s with its body and content type", async (method, handler) => {
    await handler(
      request("/bon/1", {
        method,
        body: '{"a":1}',
        headers: { cookie: "luna.auth.token=abc", "content-type": "application/json" },
      }),
    );
    const [, init] = sent();
    expect(init.method).toBe(method);
    expect(init.body).toBe('{"a":1}');
    expect(init.headers["content-type"]).toBe("application/json");
    expect(init.headers["X-Auth-Token"]).toBe("abc");
  });

  it("does not forward the browser's cookies or a client-supplied X-Auth-Token", async () => {
    await GET(
      request("/klant", {
        headers: { cookie: "luna.auth.token=abc; other=secret", "x-auth-token": "forged" },
      }),
    );
    const headers = sent()[1].headers;
    expect(headers["X-Auth-Token"]).toBe("abc");
    expect(headers).not.toHaveProperty("cookie");
    expect(headers).not.toHaveProperty("x-auth-token");
  });

  it("sends no token when there is no cookie and lets the backend answer", async () => {
    await GET(request("/klant"));
    expect(sent()[1].headers).not.toHaveProperty("X-Auth-Token");
  });

  it("passes backend error statuses and bodies through", async () => {
    fetchMock.mockResolvedValue(upstreamJson({ error: { message: "Niet gevonden" } }, 404));
    const res = await GET(request("/klant/9", { headers: { cookie: "luna.auth.token=abc" } }));
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: { message: "Niet gevonden" } });
    expect(res.headers.getSetCookie()).toEqual([]);
  });

  it("clears both session cookies when the backend answers 401 to a cookie token", async () => {
    fetchMock.mockResolvedValue(upstreamJson({ error: { message: "Ongeldige of verlopen sessie" } }, 401));
    const res = await GET(request("/klant", { headers: { cookie: "luna.auth.token=stale" } }));
    expect(res.status).toBe(401);
    const cookies = res.headers.getSetCookie().join("\n");
    expect(cookies).toContain("luna.auth.token=;");
    expect(cookies).toContain("luna.auth.user=;");
  });

  it.each(["/..%2fadmin", "/a%2f..%2fb", "/a%2F%2E%2E%2Fb", "/%zz"])(
    "rejects unsafe path %s",
    async (path) => {
      const res = await GET(request(path, { headers: { cookie: "luna.auth.token=abc" } }));
      expect(res.status).toBe(404);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it.each(["/login", "/logout", "/login/"])("does not proxy %s (dedicated server actions)", async (path) => {
    const res = await POST(request(path, { method: "POST", body: "{}" }));
    expect(res.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects state-changing requests from another origin", async () => {
    const res = await POST(
      request("/bon", {
        method: "POST",
        body: "{}",
        headers: { origin: "https://evil.example", cookie: "luna.auth.token=abc" },
      }),
    );
    expect(res.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("accepts state-changing requests from the same origin", async () => {
    const res = await POST(
      request("/bon", {
        method: "POST",
        body: "{}",
        headers: { origin: "http://localhost:3000", cookie: "luna.auth.token=abc" },
      }),
    );
    expect(res.status).toBe(200);
  });
});
