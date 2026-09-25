import { afterEach, describe, expect, it, vi } from "vitest";
import {
  afhalenPakbon,
  bonHerstelNaarDiagnose,
  createBonLedLijn,
  createOfferte,
  createOfflijn,
  deleteOfflijn,
  getBoxOverzicht,
  getLakproductieItems,
  getPakbonnen,
  logout,
  reorderOfflijn,
  reserveerBonLijn,
  searchDashboardAi,
  updateOfferte,
  updateOfflijn,
} from "../api-client";

// apiGet must parse the same {"error":{"message":...}} envelope as
// apiPost/apiPut/apiDelete instead of throwing a generic status message -
// GET calls were the one verb missing this until this fix.
describe("apiGet error handling", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("surfaces the backend's error.message on a non-ok GET response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: { message: "Ontbrekende parameter 'scan'" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(getLakproductieItems()).rejects.toThrow("Ontbrekende parameter 'scan'");
  });

  it("falls back to a generic status message when there is no error envelope", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error("not json");
      },
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(getLakproductieItems()).rejects.toThrow(/failed with status 500/);
  });
});

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

describe("reserveerBonLijn", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts the delta and returns the full updated bonlijn", async () => {
    const updatedLijn = { bonnr: 100, lijnnr: 1, gereserv: 5, effectiefGereserv: 5, swEffectief: true };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => updatedLijn });
    vi.stubGlobal("fetch", fetchMock);

    const result = await reserveerBonLijn(100, 1, 3);

    expect(result).toEqual(updatedLijn);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/bon/100/lijn/1/reservering");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ delta: 3 });
  });

  it("surfaces the backend's exact error message on a 400", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: { message: "Delta buiten toegelaten bereik." } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(reserveerBonLijn(100, 1, 999)).rejects.toThrow(
      "Delta buiten toegelaten bereik."
    );
  });
});

describe("createBonLedLijn", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("surfaces the backend's 400 when siktaKleurKodes[1] is missing", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: { message: "siktaKleurKodes[1] is verplicht." } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      createBonLedLijn(100, {
        groepnr: 1,
        ledLijn: 1,
        docLijnnr: 1,
        soort: "LED",
        kode: "K1",
        artnr: "ART-1",
        aantal: 1,
        lengte: 1000,
        lMaat: 0,
        rMaat: 0,
        switch1: "",
        switch2: "",
        reflector: "",
        prijs: 0,
        montagePrijs: 0,
        circuit: "",
        comp: "",
        sturing: "",
        opm: "",
        siktaKleurKodes: ["", "", "", "", ""],
      })
    ).rejects.toThrow("siktaKleurKodes[1] is verplicht.");
  });
});

describe("bonHerstelNaarDiagnose", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts without a body and returns the updated herstel record", async () => {
    const updated = { bonnr: 100, stempel: "DIAGNOSE" };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => updated });
    vi.stubGlobal("fetch", fetchMock);

    const result = await bonHerstelNaarDiagnose(100);

    expect(result).toEqual(updated);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/bon/100/herstel/diagnose");
    expect(init.method).toBe("POST");
  });

  it("surfaces a 409 when bon.type is not HERSTELLING", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: { message: "Bon is geen HERSTELLING." } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(bonHerstelNaarDiagnose(100)).rejects.toThrow("Bon is geen HERSTELLING.");
  });
});

describe("afhalenPakbon", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts the afgehaaldId and returns the full updated pakbon", async () => {
    const updated = { paknr: 500, afgehaald: true, afgehaaldId: "ID-1" };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => updated });
    vi.stubGlobal("fetch", fetchMock);

    const result = await afhalenPakbon(500, "ID-1");

    expect(result).toEqual(updated);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/pakbon/500/afhalen");
    expect(JSON.parse(init.body as string)).toEqual({ afgehaaldId: "ID-1" });
  });
});

describe("getPakbonnen", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("builds the query string from every supported filter", async () => {
    const response = { items: [], page: 1, pageSize: 25, hasMore: false };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => response });
    vi.stubGlobal("fetch", fetchMock);

    await getPakbonnen({ klnr: 14644, stempel: "OPEN", paknr: "5", naam: "CONE", projectnr: 1 });

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain("/pakbon?");
    expect(url).toContain("klnr=14644");
    expect(url).toContain("stempel=OPEN");
    expect(url).toContain("paknr=5");
    expect(url).toContain("naam=CONE");
    expect(url).toContain("projectnr=1");
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

describe("getBoxOverzicht", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("GETs /npp/boxoverzicht with the scan value URL-encoded", async () => {
    const result = {
      bonnr: 12345,
      groepnr: 1,
      klant: "CONE LIGHTING BV",
      opmerking: "niets",
      empty: false,
      articles: [{ artnr: "ART-1", omschrijving: "Profiel", aantal: 3, barcode: "590123" }],
    };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => result });
    vi.stubGlobal("fetch", fetchMock);

    const data = await getBoxOverzicht("B12345-1");

    expect(data).toEqual(result);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/npp/boxoverzicht?scan=");
    expect(url).toContain(encodeURIComponent("B12345-1"));
    expect(init.method).toBe("GET");
  });

  it("surfaces the backend's message for an unknown boxlabel", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: { message: "Onbekend boxlabel" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(getBoxOverzicht("garbage")).rejects.toThrow("Onbekend boxlabel");
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
