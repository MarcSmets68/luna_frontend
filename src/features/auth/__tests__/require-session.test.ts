import { beforeEach, describe, expect, it, vi } from "vitest";
import { requireSession, redirectIfAuthenticated } from "../require-session";
import { saveSession, type Session } from "../session";

const validSession: Session = {
  token: "abc123",
  kode: "MS",
  naam: "Marc Smets",
  niveau: 9,
  everyoneAdminActive: false,
  expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
};

const expiredSession: Session = {
  ...validSession,
  expiresAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
};

beforeEach(() => {
  window.sessionStorage.clear();
});

describe("requireSession", () => {
  it("returns the session and does not redirect when valid", () => {
    saveSession(validSession);
    const replace = vi.fn();
    const result = requireSession({ replace });
    expect(result).toEqual(validSession);
    expect(replace).not.toHaveBeenCalled();
  });

  it("redirects to /login and returns null when there is no session", () => {
    const replace = vi.fn();
    const result = requireSession({ replace });
    expect(result).toBeNull();
    expect(replace).toHaveBeenCalledWith("/login");
  });

  it("redirects to /login and returns null when the session is expired", () => {
    saveSession(expiredSession);
    const replace = vi.fn();
    const result = requireSession({ replace });
    expect(result).toBeNull();
    expect(replace).toHaveBeenCalledWith("/login");
  });

  it("redirects to a custom path when given one", () => {
    const replace = vi.fn();
    requireSession({ replace }, "/custom-login");
    expect(replace).toHaveBeenCalledWith("/custom-login");
  });
});

describe("redirectIfAuthenticated", () => {
  it("redirects to / and returns true when a valid session exists", () => {
    saveSession(validSession);
    const replace = vi.fn();
    const result = redirectIfAuthenticated({ replace });
    expect(result).toBe(true);
    expect(replace).toHaveBeenCalledWith("/");
  });

  it("does not redirect and returns false when there is no session", () => {
    const replace = vi.fn();
    const result = redirectIfAuthenticated({ replace });
    expect(result).toBe(false);
    expect(replace).not.toHaveBeenCalled();
  });

  it("does not redirect when the session is expired", () => {
    saveSession(expiredSession);
    const replace = vi.fn();
    const result = redirectIfAuthenticated({ replace });
    expect(result).toBe(false);
    expect(replace).not.toHaveBeenCalled();
  });
});
