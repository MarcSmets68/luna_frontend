import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LedQcForm } from "../led-qc-form";
import { createBonLedQc, type BonLedQcItem } from "@/lib/api-client";
import { confirmNavigation } from "@/lib/unsaved-changes";

vi.mock("@/lib/api-client", () => ({ createBonLedQc: vi.fn(), updateBonLedQc: vi.fn() }));
afterEach(() => vi.restoreAllMocks());

describe("unsaved dialog changes", () => {
  it("keeps edits when closing is canceled and clears them after an explicit discard", () => {
    const onOpenChange = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<LedQcForm bonnr={1} open onOpenChange={onOpenChange} onSaved={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Omschrijving"), { target: { value: "Edited" } });
    fireEvent.click(screen.getByRole("button", { name: "Annuleren" }));
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Omschrijving")).toHaveValue("Edited");
    vi.mocked(window.confirm).mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: "Annuleren" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByLabelText("Omschrijving")).toHaveValue("");
    vi.mocked(window.confirm).mockClear();
    expect(confirmNavigation()).toBe(true);
    expect(window.confirm).not.toHaveBeenCalled();
  });

  it("closes after a successful save without a discard warning", async () => {
    const onSaved = vi.fn();
    const onOpenChange = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(false);
    vi.mocked(createBonLedQc).mockResolvedValue({} as BonLedQcItem);
    render(<LedQcForm bonnr={1} open onOpenChange={onOpenChange} onSaved={onSaved} />);
    fireEvent.change(screen.getByLabelText("Omschrijving"), { target: { value: "Edited" } });
    fireEvent.click(screen.getByRole("button", { name: "Opslaan" }));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(confirmNavigation()).toBe(true);
    expect(window.confirm).not.toHaveBeenCalled();
  });
});
