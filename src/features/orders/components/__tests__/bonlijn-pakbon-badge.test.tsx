import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BonlijnPakbonBadge } from "../bonlijn-pakbon-badge";

const getRefs = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api-client", () => ({ getBonLijnPakbonnen: getRefs }));

describe("BonlijnPakbonBadge", () => {
  it("shows a neutral warning when references cannot load", async () => {
    getRefs.mockRejectedValue(new Error("Offline"));
    render(<BonlijnPakbonBadge bonnr={1} lijnnr={2} />);
    const badge = await screen.findByLabelText("Pakbonnen konden niet geladen worden");
    expect(badge).toHaveTextContent("?");
    expect(badge).toHaveAttribute("title", "Pakbonnen konden niet geladen worden");
  });

  it("renders references", async () => {
    getRefs.mockResolvedValue([{ paknr: 42, afgehaald: false }]);
    render(<BonlijnPakbonBadge bonnr={1} lijnnr={2} />);
    expect(await screen.findByRole("link", { name: "Pakbon 42" })).toHaveAttribute("href", "/pakbonnen/42");
  });

  it("renders nothing for empty references", async () => {
    getRefs.mockResolvedValue([]);
    const { container } = render(<BonlijnPakbonBadge bonnr={1} lijnnr={2} />);
    await vi.waitFor(() => expect(getRefs).toHaveResolved());
    expect(container).toBeEmptyDOMElement();
  });
});
