import { afterEach, describe, expect, it, vi } from "vitest";
import { logout } from "../api-client";

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
