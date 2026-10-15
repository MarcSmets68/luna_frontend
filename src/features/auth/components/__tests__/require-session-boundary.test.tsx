import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RequireSessionBoundary } from "../require-session-boundary";
import { saveSession } from "../../session";

const replaceMock = vi.fn();
let pathname = "/";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  usePathname: () => pathname,
}));

beforeEach(() => {
  replaceMock.mockReset();
  pathname = "/";
  window.sessionStorage.clear();
});

describe("RequireSessionBoundary", () => {
  it("redirects to /login when there is no valid session", () => {
    render(
      <RequireSessionBoundary>
        <div>Dashboard content</div>
      </RequireSessionBoundary>
    );

    expect(replaceMock).toHaveBeenCalledWith("/login");
  });

  it("does not redirect and keeps rendering children when a valid session exists", () => {
    saveSession({
      token: "tok-1",
      kode: "MS",
      naam: "Marc Smets",
      niveau: 9,
      everyoneAdminActive: false,
      expiresAt: "2099-01-01T00:00:00.000Z",
    });

    render(
      <RequireSessionBoundary>
        <div>Dashboard content</div>
      </RequireSessionBoundary>
    );

    expect(replaceMock).not.toHaveBeenCalled();
    expect(screen.getByText("Dashboard content")).toBeInTheDocument();
  });

  it("does not render children (neutral loading state) without a valid session", () => {
    render(
      <RequireSessionBoundary>
        <div>Dashboard content</div>
      </RequireSessionBoundary>
    );

    expect(screen.queryByText("Dashboard content")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("does not render children for an expired session and redirects", () => {
    saveSession({
      token: "tok-1",
      kode: "MS",
      naam: "Marc Smets",
      niveau: 9,
      everyoneAdminActive: false,
      expiresAt: "2000-01-01T00:00:00.000Z",
    });

    render(
      <RequireSessionBoundary>
        <div>Dashboard content</div>
      </RequireSessionBoundary>
    );

    expect(screen.queryByText("Dashboard content")).not.toBeInTheDocument();
    expect(replaceMock).toHaveBeenCalledWith("/login");
  });

  it("guards routes other than the dashboard", () => {
    pathname = "/klanten";
    render(
      <RequireSessionBoundary>
        <div>Klanten content</div>
      </RequireSessionBoundary>
    );

    expect(screen.queryByText("Klanten content")).not.toBeInTheDocument();
    expect(replaceMock).toHaveBeenCalledWith("/login");
  });

  it("always renders /login without a session and never redirects from it", () => {
    pathname = "/login";
    render(
      <RequireSessionBoundary>
        <div>Login form</div>
      </RequireSessionBoundary>
    );

    expect(screen.getByText("Login form")).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });
});
