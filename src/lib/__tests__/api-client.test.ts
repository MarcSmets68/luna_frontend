import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createOfferte,
  createOfflijn,
  deleteOfflijn,
  logout,
  reorderOfflijn,
  searchDashboardAi,
  updateOfferte,
  updateOfflijn,
} from "../api-client";

// logout() must send the session token via the "X-Auth-Token" header, NOT
// "Authorization: Bearer <token>" - PASOE/Tomcat intercepts the standard
// Authorization header before it reaches the WebHandler layer (see
// docs/architecture/login-auth-ontwerp.md Sec 1.4 deviation note).
describe("logout", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends the token via the X-Auth-Token header, not Authorization", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: "Uitgelogd" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await logout("tok-1");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers["X-Auth-Token"]).toBe("tok-1");
    expect(headers.Authorization).toBeUndefined();
  });
});

describe("searchDashboardAi", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts the prompt to /ai-search and returns the parsed response", async () => {
    const response = {
      queryText: "open offertes CONE LIGHTING",
      resultType: "results",
      entity: "offerte",
      intent: {
        entity: "offerte",
        filters: [{ field: "naam", operator: "contains", value: "CONE LIGHTING" }],
        aggregation: null,
        confidence: 0.9,
      },
      items: [{ offnr: 2167769, naam: "CONE LIGHTING BV" }],
      page: 1,
      pageSize: 25,
      hasMore: false,
      summary: "1 offerte gevonden.",
      clarificationQuestion: null,
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => response,
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await searchDashboardAi("open offertes CONE LIGHTING");

    expect(result).toEqual(response);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/ai-search");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ prompt: "open offertes CONE LIGHTING" });
  });

  it("surfaces the backend's error.message instead of throwing a generic status error", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({ error: { message: "AI-zoekdienst is tijdelijk niet beschikbaar" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(searchDashboardAi("iets")).rejects.toThrow(
      "AI-zoekdienst is tijdelijk niet beschikbaar"
    );
  });
});

describe("offerte create/update", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("createOfferte posts to /offerte without an offnr/versie key", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ offnr: 123, versie: 1, klnr: 14644 }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await createOfferte({ klnr: 14644, naam: "Test" });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/offerte");
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body as string);
    expect(body).not.toHaveProperty("offnr");
    expect(body).not.toHaveProperty("versie");
    expect(body.klnr).toBe(14644);
  });

  it("updateOfferte puts to /offerte/{offnr}/{versie}", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ offnr: 123, versie: 1 }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await updateOfferte(123, 1, { naam: "Nieuwe naam" });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/offerte/123/1");
    expect(init.method).toBe("PUT");
  });
});

describe("offlijn CRUD", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("createOfflijn posts to the nested lijn endpoint without a lijnnr key", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ offnr: 123, versie: 1, lijnnr: 10 }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await createOfflijn(123, 1, { artnr: "ABC" });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/offerte/123/1/lijn");
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body as string);
    expect(body).not.toHaveProperty("lijnnr");
  });

  it("updateOfflijn puts to the nested lijn endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ offnr: 123, versie: 1, lijnnr: 10 }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await updateOfflijn(123, 1, 10, { aantal: 5 });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/offerte/123/1/lijn/10");
    expect(init.method).toBe("PUT");
  });

  it("deleteOfflijn deletes the nested lijn endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: "deleted", offnr: 123, versie: 1, lijnnr: 10 }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await deleteOfflijn(123, 1, 10);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/offerte/123/1/lijn/10");
    expect(init.method).toBe("DELETE");
    expect(result.status).toBe("deleted");
  });

  it("reorderOfflijn posts a direction and unwraps the full items list", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [{ offnr: 123, versie: 1, lijnnr: 10 }] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await reorderOfflijn(123, 1, 20, "up");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/offerte/123/1/lijn/20/reorder");
    expect(JSON.parse(init.body as string)).toEqual({ direction: "up" });
    expect(result).toEqual([{ offnr: 123, versie: 1, lijnnr: 10 }]);
  });
});
