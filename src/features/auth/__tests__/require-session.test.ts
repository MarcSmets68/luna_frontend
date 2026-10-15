import { beforeEach, describe, expect, it, vi } from "vitest";
import { redirectIfAuthenticated } from "../require-session";
import { clearSession, saveSession, type Session } from "../session";

const validSession: Session = {
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
  clearSession();
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
