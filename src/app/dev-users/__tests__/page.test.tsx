import { afterEach, describe, expect, it, vi } from "vitest";

const notFoundMock = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("NEXT_HTTP_ERROR_FALLBACK;404");
  }),
);
const getDevUsersMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ notFound: notFoundMock, usePathname: () => "/dev-users" }));
vi.mock("@/lib/api-client", () => ({ getDevUsers: getDevUsersMock }));
vi.mock("@/components/layout/app-shell", () => ({ AppShell: ({ children }: { children: unknown }) => children }));
vi.mock("@/features/dev-users/components/dev-users-page", () => ({ DevUsersPage: () => null }));

import DevUsers from "../page";

describe("/dev-users page", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("returns 404 in production without calling the backend", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await expect(DevUsers()).rejects.toThrow("404");
    expect(notFoundMock).toHaveBeenCalled();
    expect(getDevUsersMock).not.toHaveBeenCalled();
  });

  it("loads the users outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    getDevUsersMock.mockResolvedValue([]);
    await DevUsers();
    expect(notFoundMock).not.toHaveBeenCalled();
    expect(getDevUsersMock).toHaveBeenCalledTimes(1);
  });
});
