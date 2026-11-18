import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Topbar } from "../topbar";
import { clearSession, getSession, saveSession, type Session } from "@/features/auth/session";
import { useUnsavedChanges } from "@/lib/unsaved-changes";

const pushMock = vi.fn();
let pathnameMock = "/";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => pathnameMock,
}));

const logoutMock = vi.fn();
vi.mock("@/features/auth/actions", () => ({
  logoutAction: (...args: unknown[]) => logoutMock(...args),
}));

const session: Session = {
  kode: "MS",
  naam: "Marc Smets",
  niveau: 9,
  everyoneAdminActive: false,
  expiresAt: "2099-01-01T00:00:00.000Z",
};

beforeEach(() => {
  pushMock.mockReset();
  logoutMock.mockReset();
  logoutMock.mockResolvedValue(undefined);
  pathnameMock = "/";
  clearSession();
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

  it("logging out calls the logout action, clears the local session, and redirects to /login", async () => {
    saveSession(session);
    const user = userEvent.setup();
    render(<Topbar />);

    await user.click(screen.getByRole("button", { name: "Uitloggen" }));

    await waitFor(() => expect(logoutMock).toHaveBeenCalledTimes(1));
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

  it("renders both interface-switch buttons with Luna active by default", () => {
    render(<Topbar />);
    const lunaButton = screen.getByRole("button", { name: "Luna" });
    const nppButton = screen.getByRole("button", { name: "NPP" });
    expect(lunaButton).toBeInTheDocument();
    expect(nppButton).toBeInTheDocument();
    expect(lunaButton.className).toContain("bg-primary");
    expect(nppButton.className).not.toContain("bg-primary");
  });

  it("clicking NPP navigates to /npp without changing the active route prematurely", async () => {
    const user = userEvent.setup();
    render(<Topbar />);

    await user.click(screen.getByRole("button", { name: "NPP" }));

    expect(pushMock).toHaveBeenCalledWith("/npp");
    expect(screen.getByRole("button", { name: "Luna" })).toHaveAttribute("aria-pressed", "true");
  });

  it("clicking Luna while on /npp navigates back to /", async () => {
    pathnameMock = "/npp";
    const user = userEvent.setup();
    render(<Topbar />);

    await user.click(screen.getByRole("button", { name: "Luna" }));

    expect(pushMock).toHaveBeenCalledWith("/");
  });

  it("clicking Luna while already elsewhere in the Luna app does not navigate", async () => {
    pathnameMock = "/klanten";
    const user = userEvent.setup();
    render(<Topbar />);

    await user.click(screen.getByRole("button", { name: "Luna" }));

    expect(pushMock).not.toHaveBeenCalled();
  });

  it.each(["/npp/scannen", "/npp/stockbeweging", "/npp/reservaties/123", "/npp/planning", "/npp/boxoverzicht", "/npp/kwaliteitscontrole", "/npp/reservaties/mockup"])("uses the route as active mode and returns to Luna from %s", async (path) => {
    pathnameMock = path;
    sessionStorage.setItem("luna.interfaceMode", "luna");
    const user = userEvent.setup();
    render(<Topbar />);
    expect(screen.getByRole("button", { name: "NPP" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Luna" }));
    expect(pushMock).toHaveBeenCalledWith("/");
  });

  it("does not treat /npp-other as an NPP route", () => {
    pathnameMock = "/npp-other";
    render(<Topbar />);
    expect(screen.getByRole("button", { name: "Luna" })).toHaveAttribute("aria-pressed", "true");
  });

  it("cancels switching and logout before side effects when changes are kept", async () => {
    function DirtyForm() { useUnsavedChanges(true); return <Topbar />; }
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    saveSession(session);
    render(<DirtyForm />);
    await user.click(screen.getByRole("button", { name: "NPP" }));
    await user.click(screen.getByRole("button", { name: "Uitloggen" }));
    expect(pushMock).not.toHaveBeenCalled();
    expect(logoutMock).not.toHaveBeenCalled();
    expect(getSession()).not.toBeNull();
    expect(confirm).toHaveBeenCalledTimes(2);
    confirm.mockRestore();
  });
});
