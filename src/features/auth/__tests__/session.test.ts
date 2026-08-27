import { beforeEach, describe, expect, it } from "vitest";
import {
  clearSession,
  getSession,
  getValidSession,
  isSessionExpired,
  saveSession,
  type Session,
} from "../session";

const validSession: Session = {
  token: "abc123",
  kode: "MS",
  naam: "Marc Smets",
  niveau: 9,
  everyoneAdminActive: true,
  expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
};

const expiredSession: Session = {
  ...validSession,
  expiresAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
};

beforeEach(() => {
  window.sessionStorage.clear();
});

describe("session.ts", () => {
  it("writes and reads back a session", () => {
    saveSession(validSession);
    expect(getSession()).toEqual(validSession);
  });

  it("returns null when nothing is stored", () => {
    expect(getSession()).toBeNull();
  });

  it("clears the stored session", () => {
    saveSession(validSession);
    clearSession();
    expect(getSession()).toBeNull();
  });

  it("returns null for malformed JSON instead of throwing", () => {
    window.sessionStorage.setItem("luna.auth.session", "{not-json");
    expect(getSession()).toBeNull();
  });

  it("isSessionExpired is false for a future expiresAt", () => {
    expect(isSessionExpired(validSession)).toBe(false);
  });

  it("isSessionExpired is true for a past expiresAt", () => {
    expect(isSessionExpired(expiredSession)).toBe(true);
  });

  it("isSessionExpired is true for an unparseable expiresAt", () => {
    expect(isSessionExpired({ ...validSession, expiresAt: "not-a-date" })).toBe(true);
  });

  it("getValidSession returns the session when still valid", () => {
    saveSession(validSession);
    expect(getValidSession()).toEqual(validSession);
  });

  it("getValidSession returns null and clears storage for an expired session", () => {
    saveSession(expiredSession);
    expect(getValidSession()).toBeNull();
    expect(getSession()).toBeNull();
  });
});
