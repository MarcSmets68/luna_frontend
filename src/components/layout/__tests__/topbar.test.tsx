import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Topbar } from "../topbar";
import { getSession, saveSession, type Session } from "@/features/auth/session";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const logoutMock = vi.fn();
vi.mock("@/lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-client")>("@/lib/api-client");
  return {
    ...actual,
    logout: (...args: unknown[]) => logoutMock(...args),
  };
});

const session: Session = {
  token: "tok-1",
  kode: "MS",
  naam: "Marc Smets",
  niveau: 9,
  everyoneAdminActive: false,
  expiresAt: "2099-01-01T00:00:00.000Z",
};

beforeEach(() => {
  pushMock.mockReset();
  logoutMock.mockReset();
  logoutMock.mockResolvedValue({ message: "Uitgelogd" });
  window.sessionStorage.clear();
});

describe("Topbar", () => {
  it("shows the logged-in user's naam", async () => {
    saveSession(session);
    render(<Topbar />);
    expect(await screen.findByText("Marc Smets")).toBeInTheDocument();
    expect(screen.getAllByText("MS").length).toBeGreaterThan(0);
  });

  it("shows a fallback when there is no session", () => {
    render(<Topbar />);
    expect(screen.getByText("Niet ingelogd")).toBeInTheDocument();
  });

  it("logging out calls the API with the token, clears the local session, and redirects to /login", async () => {
    saveSession(session);
    const user = userEvent.setup();
    render(<Topbar />);

    await user.click(screen.getByRole("button", { name: "Uitloggen" }));

    await waitFor(() => expect(logoutMock).toHaveBeenCalledWith("tok-1"));
    expect(getSession()).toBeNull();
    expect(pushMock).toHaveBeenCalledWith("/login");
  });

  it("still clears the session and redirects even when the API call fails", async () => {
    saveSession(session);
    logoutMock.mockRejectedValue(new Error("Ongeldige of verlopen sessie"));
    const user = userEvent.setup();
    render(<Topbar />);

    await user.click(screen.getByRole("button", { name: "Uitloggen" }));

    await waitFor(() => expect(getSession()).toBeNull());
    expect(pushMock).toHaveBeenCalledWith("/login");
  });
});
