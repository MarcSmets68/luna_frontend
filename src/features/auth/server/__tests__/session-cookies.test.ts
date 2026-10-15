// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const store = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
}));
vi.mock("next/headers", () => ({ cookies: async () => store }));

import {
  clearSessionCookies,
  getAuthToken,
  setSessionCookies,
} from "../session-cookies";

const login = {
  token: "secret-token",
  kode: "MS",
  naam: "Marc Smets",
  niveau: 9,
  everyoneAdminActive: true,
  expiresAt: "2099-01-01T00:00:00.000Z",
};

describe("session cookies", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.unstubAllEnvs());

  it("stores the token in an httpOnly, SameSite=Lax cookie expiring at expiresAt", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await setSessionCookies(login);
    expect(store.set).toHaveBeenCalledWith("luna.auth.token", "secret-token", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      expires: new Date("2099-01-01T00:00:00.000Z"),
    });
  });

  it("returns and stores only non-sensitive user info in a readable cookie", async () => {
    const user = await setSessionCookies(login);
    expect(user).toEqual({
      kode: "MS",
      naam: "Marc Smets",
      niveau: 9,
      everyoneAdminActive: true,
      expiresAt: "2099-01-01T00:00:00.000Z",
    });
    expect(user).not.toHaveProperty("token");
    const [name, value, options] = store.set.mock.calls[1];
    expect(name).toBe("luna.auth.user");
    expect(JSON.parse(value)).toEqual(user);
    expect(value).not.toContain("secret-token");
    expect(options.httpOnly).toBe(false);
  });

  it("is not Secure outside production, and AUTH_COOKIE_SECURE overrides it", async () => {
    vi.stubEnv("NODE_ENV", "development");
    await setSessionCookies(login);
    expect(store.set.mock.calls[0][2].secure).toBe(false);

    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AUTH_COOKIE_SECURE", "false");
    await setSessionCookies(login);
    expect(store.set.mock.calls[2][2].secure).toBe(false);

    vi.stubEnv("AUTH_COOKIE_SECURE", "true");
    vi.stubEnv("NODE_ENV", "development");
    await setSessionCookies(login);
    expect(store.set.mock.calls[4][2].secure).toBe(true);
  });

  it("falls back to a browser-session cookie when expiresAt is unparseable", async () => {
    await setSessionCookies({ ...login, expiresAt: "garbage" });
    expect(store.set.mock.calls[0][2]).not.toHaveProperty("expires");
  });

  it("reads the token, and returns undefined when the cookie is gone (expired)", async () => {
    store.get.mockReturnValueOnce({ name: "luna.auth.token", value: "abc" });
    await expect(getAuthToken()).resolves.toBe("abc");
    store.get.mockReturnValueOnce(undefined);
    await expect(getAuthToken()).resolves.toBeUndefined();
  });

  it("clears both cookies", async () => {
    await clearSessionCookies();
    expect(store.delete).toHaveBeenCalledWith("luna.auth.token");
    expect(store.delete).toHaveBeenCalledWith("luna.auth.user");
  });
});
