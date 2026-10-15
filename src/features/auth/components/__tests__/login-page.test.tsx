import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginPage } from "../login-page";
import { clearSession, getSession, saveSession } from "../../session";

const pushMock = vi.fn();
const replaceMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock }),
}));

const loginMock = vi.fn();
vi.mock("../../actions", () => ({
  loginAction: (...args: unknown[]) => loginMock(...args),
}));

beforeEach(() => {
  pushMock.mockReset();
  replaceMock.mockReset();
  loginMock.mockReset();
  clearSession();
});

describe("LoginPage", () => {
  it("renders the login form", () => {
    render(<LoginPage />);
    expect(screen.getByRole("button", { name: "Inloggen" })).toBeInTheDocument();
  });

  it("saves the session and redirects to the dashboard on a successful login", async () => {
    const user = userEvent.setup();
    loginMock.mockResolvedValue({
      ok: true,
      user: {
        kode: "MS",
        naam: "Marc Smets",
        niveau: 9,
        everyoneAdminActive: true,
        expiresAt: "2099-01-01T00:00:00.000Z",
      },
    });

    render(<LoginPage />);
    await user.type(screen.getByRole("textbox", { name: "Gebruikerskode" }), "MS");
    await user.type(screen.getByLabelText("Wachtwoord"), "geheim123");
    await user.click(screen.getByRole("button", { name: "Inloggen" }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/"));
    expect(loginMock).toHaveBeenCalledWith({ kode: "MS", password: "geheim123" });
    expect(getSession()).toEqual({
      kode: "MS",
      naam: "Marc Smets",
      niveau: 9,
      everyoneAdminActive: true,
      expiresAt: "2099-01-01T00:00:00.000Z",
    });
  });

  it("shows the server error and does not redirect on a failed login", async () => {
    const user = userEvent.setup();
    loginMock.mockResolvedValue({
      ok: false,
      status: 401,
      message: "Gebruikersnaam of wachtwoord onjuist",
    });

    render(<LoginPage />);
    await user.type(screen.getByRole("textbox", { name: "Gebruikerskode" }), "MS");
    await user.type(screen.getByLabelText("Wachtwoord"), "verkeerd");
    await user.click(screen.getByRole("button", { name: "Inloggen" }));

    expect(await screen.findByText("Gebruikersnaam of wachtwoord onjuist")).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
    expect(getSession()).toBeNull();
  });

  it("redirects to the dashboard immediately when a valid session already exists", () => {
    saveSession({
      kode: "MS",
      naam: "Marc Smets",
      niveau: 9,
      everyoneAdminActive: false,
      expiresAt: "2099-01-01T00:00:00.000Z",
    });

    render(<LoginPage />);

    expect(replaceMock).toHaveBeenCalledWith("/");
  });
});
