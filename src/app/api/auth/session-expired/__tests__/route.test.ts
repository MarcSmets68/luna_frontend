// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  clearSessionCookies: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));
vi.mock("@/features/auth/server/session-cookies", () => ({ clearSessionCookies: m.clearSessionCookies }));
vi.mock("next/navigation", () => ({ redirect: m.redirect }));

import { GET } from "../route";

describe("GET /api/auth/session-expired", () => {
  it("clears the session cookies and redirects to /login", async () => {
    await expect(GET()).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(m.clearSessionCookies).toHaveBeenCalledTimes(1);
  });
});
