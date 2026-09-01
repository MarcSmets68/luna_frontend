import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RequireSessionBoundary } from "../require-session-boundary";
import { saveSession } from "../../session";

const replaceMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

beforeEach(() => {
  replaceMock.mockReset();
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
});
