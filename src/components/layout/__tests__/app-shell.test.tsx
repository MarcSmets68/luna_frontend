import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "../app-shell";
import { saveSession, type Session } from "@/features/auth/session";

// AppShell wires TestModeBanner to session.everyoneAdminActive (see
// docs/architecture/login-auth-ontwerp.md par 4.2: "app-shell.tsx toont
// TestModeBanner wanneer everyoneAdminActive === true"). TestModeBanner
// and Topbar have their own dedicated test files covering their own
// internals in isolation; this file covers the wiring between AppShell
// and the stored session that neither of those covers on its own.
// Added by frontend-tester: this file was missing coverage of that wiring.

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

const BANNER_TEXT = "alle gebruikers hebben tijdelijk adminrechten";

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    token: "tok-1",
    kode: "MS",
    naam: "Marc Smets",
    niveau: 9,
    everyoneAdminActive: false,
    expiresAt: "2099-01-01T00:00:00.000Z",
    ...overrides,
  };
}

beforeEach(() => {
  window.sessionStorage.clear();
});

describe("AppShell", () => {
  it("shows the TestModeBanner when the stored session has everyoneAdminActive: true", () => {
    saveSession(makeSession({ everyoneAdminActive: true }));
    render(<AppShell>content</AppShell>);
    expect(screen.getByText(new RegExp(BANNER_TEXT))).toBeInTheDocument();
  });

  it("hides the TestModeBanner when the stored session has everyoneAdminActive: false", () => {
    saveSession(makeSession({ everyoneAdminActive: false }));
    render(<AppShell>content</AppShell>);
    expect(screen.queryByText(new RegExp(BANNER_TEXT))).not.toBeInTheDocument();
  });

  it("hides the TestModeBanner when there is no session at all", () => {
    render(<AppShell>content</AppShell>);
    expect(screen.queryByText(new RegExp(BANNER_TEXT))).not.toBeInTheDocument();
  });

  it("still renders its children", () => {
    render(<AppShell>unique-children-marker</AppShell>);
    expect(screen.getByText("unique-children-marker")).toBeInTheDocument();
  });
});

