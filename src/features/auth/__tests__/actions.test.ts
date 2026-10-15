// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  login: vi.fn(),
  logout: vi.fn(),
  setSessionCookies: vi.fn(),
  clearSessionCookies: vi.fn(),
  getAuthToken: vi.fn(),
}));

vi.mock("@/lib/api/auth", () => ({ login: m.login, logout: m.logout }));
vi.mock("../server/session-cookies", () => ({
  setSessionCookies: m.setSessionCookies,
  clearSessionCookies: m.clearSessionCookies,
  getAuthToken: m.getAuthToken,
}));

import { ApiError } from "@/lib/api/http";
import { loginAction, logoutAction } from "../actions";

const credentials = { kode: "MS", password: "pw" };

describe("loginAction", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sets the cookies and returns only the user info", async () => {
    const result = { token: "unique-secret-value", kode: "MS", naam: "Marc", niveau: 9, everyoneAdminActive: false, expiresAt: "x" };
    const { token, ...user } = result;
    m.login.mockResolvedValue(result);
    m.setSessionCookies.mockResolvedValue(user);

    const out = await loginAction(credentials);

    expect(m.login).toHaveBeenCalledWith(credentials);
    expect(m.setSessionCookies).toHaveBeenCalledWith(result);
    expect(out).toEqual({ ok: true, user });
    expect(JSON.stringify(out)).not.toContain(token);
  });

  it("returns the backend message and status without setting cookies on failure", async () => {
    m.login.mockRejectedValue(new ApiError(401, "Ongeldige kode of wachtwoord", "Ongeldige kode of wachtwoord"));
    await expect(loginAction(credentials)).resolves.toEqual({
      ok: false,
      message: "Ongeldige kode of wachtwoord",
      status: 401,
    });
    expect(m.setSessionCookies).not.toHaveBeenCalled();
  });

  it("returns a generic message for non-Error failures", async () => {
    m.login.mockRejectedValue("boom");
    await expect(loginAction(credentials)).resolves.toEqual({
      ok: false,
      message: "Inloggen is mislukt. Probeer het opnieuw.",
      status: undefined,
    });
  });
});

describe("logoutAction", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls the backend with the cookie token and clears the cookies", async () => {
    m.getAuthToken.mockResolvedValue("tok");
    m.logout.mockResolvedValue({ message: "ok" });
    await logoutAction();
    expect(m.logout).toHaveBeenCalledWith("tok");
    expect(m.clearSessionCookies).toHaveBeenCalledTimes(1);
  });

  it("clears the cookies even when the backend call fails", async () => {
    m.getAuthToken.mockResolvedValue("tok");
    m.logout.mockRejectedValue(new Error("down"));
    await expect(logoutAction()).resolves.toBeUndefined();
    expect(m.clearSessionCookies).toHaveBeenCalledTimes(1);
  });

  it("skips the backend call when there is no token but still clears", async () => {
    m.getAuthToken.mockResolvedValue(undefined);
    await logoutAction();
    expect(m.logout).not.toHaveBeenCalled();
    expect(m.clearSessionCookies).toHaveBeenCalledTimes(1);
  });
});
