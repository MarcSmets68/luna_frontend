import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { KlantLookup } from "../klant-lookup";

const zoek = vi.fn();
vi.mock("../../lib/actions", () => ({
  zoekKlantenAction: (...args: unknown[]) => zoek(...args),
}));

describe("KlantLookup", () => {
  beforeEach(() => {
    zoek.mockReset();
  });

  it("searches (debounced) and selects a klant", async () => {
    zoek.mockResolvedValue([{ klnr: 42, naam: "ACME BV" }]);
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<KlantLookup value={null} onChange={onChange} />);

    await user.type(screen.getByLabelText("Klant zoeken"), "acme");
    const option = await screen.findByRole("button", { name: /42 .* ACME BV/ });
    expect(zoek).toHaveBeenCalledTimes(1);
    expect(zoek).toHaveBeenCalledWith("acme");

    await user.click(option);
    expect(onChange).toHaveBeenCalledWith({ klnr: 42, naam: "ACME BV" });
  });

  it("does not search below 2 characters", async () => {
    const user = userEvent.setup();
    render(<KlantLookup value={null} onChange={vi.fn()} />);
    await user.type(screen.getByLabelText("Klant zoeken"), "a");
    await new Promise((r) => setTimeout(r, 400));
    expect(zoek).not.toHaveBeenCalled();
  });

  it("shows the selected klant and clears it", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<KlantLookup value={{ klnr: 42, naam: "ACME BV" }} onChange={onChange} />);
    expect(screen.getByText(/42 . ACME BV/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Klant wissen" }));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("shows an error when the search fails", async () => {
    zoek.mockRejectedValue(new Error("boom"));
    const user = userEvent.setup();
    render(<KlantLookup value={null} onChange={vi.fn()} />);
    await user.type(screen.getByLabelText("Klant zoeken"), "acme");
    await waitFor(() => expect(screen.getByText("Zoeken mislukt")).toBeInTheDocument());
  });
});
