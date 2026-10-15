import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, pathSegment, request } from "../http";

const BASE = "http://localhost:8080/web";

function mockFetch(response: Response) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

describe("pathSegment", () => {
  it("stringifies numbers", () => {
    expect(pathSegment(42)).toBe("42");
  });

  it("percent-encodes reserved characters", () => {
    expect(pathSegment("a/b c%")).toBe("a%2Fb%20c%25");
    expect(pathSegment("../x")).toBe("..%2Fx");
  });
});

describe("request", () => {
  beforeEach(() => {
    vi.stubEnv("API_BASE_URL", "");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("GET sends Accept and cache no-store, without body or Content-Type", async () => {
    const fetchMock = mockFetch(json({ ok: true }));
    await expect(request("GET", "/x")).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(`${BASE}/x`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
  });

  it("GET with a next config uses it instead of cache no-store", async () => {
    const fetchMock = mockFetch(json({}));
    await request("GET", "/x", { next: { revalidate: 60 } });
    expect(fetchMock).toHaveBeenCalledWith(`${BASE}/x`, {
      method: "GET",
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
  });

  it.each(["POST", "PUT"] as const)("%s sends a JSON body, Content-Type and extra headers", async (method) => {
    const fetchMock = mockFetch(json({}));
    await request(method, "/x", { body: { a: 1 }, headers: { "X-Auth-Token": "t" } });
    expect(fetchMock).toHaveBeenCalledWith(`${BASE}/x`, {
      method,
      headers: { Accept: "application/json", "Content-Type": "application/json", "X-Auth-Token": "t" },
      body: JSON.stringify({ a: 1 }),
    });
  });

  it("DELETE sends only Accept and extra headers, no cache or body", async () => {
    const fetchMock = mockFetch(json({}));
    await request("DELETE", "/x", { headers: { "X-Auth-Token": "t" } });
    expect(fetchMock).toHaveBeenCalledWith(`${BASE}/x`, {
      method: "DELETE",
      headers: { Accept: "application/json", "X-Auth-Token": "t" },
    });
  });

  it.each(["GET", "POST", "PUT", "DELETE"] as const)(
    "%s throws an ApiError with status and backendMessage",
    async (method) => {
      mockFetch(json({ error: { message: "Niet toegelaten" } }, 409));
      const error = await request(method, "/x", { body: {} }).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(ApiError);
      expect(error).toMatchObject({ status: 409, message: "Niet toegelaten", backendMessage: "Niet toegelaten" });
    },
  );

  it("falls back to the generic message when the error body is not the envelope", async () => {
    mockFetch(new Response("<html>", { status: 502 }));
    const error = await request("GET", "/x").catch((e: unknown) => e);
    expect(error).toMatchObject({
      status: 502,
      message: "API request to /x failed with status 502",
      backendMessage: undefined,
    });
  });

  it("resolves to null on 404 only when nullOn404 is set", async () => {
    mockFetch(json({ error: { message: "nf" } }, 404));
    await expect(request("GET", "/x", { nullOn404: true })).resolves.toBeNull();
    mockFetch(json({ error: { message: "nf" } }, 404));
    await expect(request("GET", "/x")).rejects.toMatchObject({ status: 404, message: "nf" });
  });

  it("uses the generic message and ignores the body when backendErrorMessages is false", async () => {
    mockFetch(json({ error: { message: "boom" } }, 500));
    const error = await request("GET", "/x", { backendErrorMessages: false }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 500, message: "API request to /x failed with status 500" });
    expect((error as ApiError).backendMessage).toBeUndefined();
  });

  it("fails in production when API_BASE_URL is missing", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const fetchMock = mockFetch(json({}));
    await expect(request("GET", "/x")).rejects.toThrow(/API_BASE_URL/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
