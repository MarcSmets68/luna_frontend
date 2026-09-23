import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Npp from "../page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/npp",
}));

describe("Npp page", () => {
  it("renders the NPP menu heading and task tiles", () => {
    render(<Npp />);
    expect(screen.getByRole("heading", { name: "NPP" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Scannen \/ verifiëren/ })).toBeInTheDocument();
  });

  it("renders the shared Topbar (logout button present)", () => {
    render(<Npp />);
    expect(screen.getByRole("button", { name: "Uitloggen" })).toBeInTheDocument();
  });

  it("does not render a sidebar/nav element", () => {
    render(<Npp />);
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(screen.queryByText("Noma")).not.toBeInTheDocument();
  });
});
