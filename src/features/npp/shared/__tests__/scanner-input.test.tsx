import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ScannerInput } from "../scanner-input";

describe("ScannerInput", () => {
  it("auto-focuses the scan field on mount", () => {
    render(<ScannerInput onSubmit={vi.fn()} loading={false} ariaLabel="Artikel scannen" />);
    expect(screen.getByLabelText("Artikel scannen")).toHaveFocus();
  });

  it("submits the trimmed value on Enter and clears the field", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ScannerInput onSubmit={onSubmit} loading={false} ariaLabel="Artikel scannen" />);

    const input = screen.getByLabelText("Artikel scannen");
    await user.type(input, "ART-1{Enter}");

    expect(onSubmit).toHaveBeenCalledWith("ART-1");
    expect(input).toHaveValue("");
  });

  it("does not submit an empty value", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ScannerInput onSubmit={onSubmit} loading={false} ariaLabel="Artikel scannen" />);

    await user.type(screen.getByLabelText("Artikel scannen"), "{Enter}");

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("disables the input and button while loading", () => {
    render(<ScannerInput onSubmit={vi.fn()} loading={true} ariaLabel="Artikel scannen" />);
    expect(screen.getByLabelText("Artikel scannen")).toBeDisabled();
    expect(screen.getByRole("button", { name: /Bezig/ })).toBeDisabled();
  });

  it("re-focuses the input once loading finishes (in-place re-scan)", () => {
    const { rerender } = render(
      <ScannerInput onSubmit={vi.fn()} loading={true} ariaLabel="Artikel scannen" />
    );
    expect(screen.getByLabelText("Artikel scannen")).not.toHaveFocus();

    rerender(<ScannerInput onSubmit={vi.fn()} loading={false} ariaLabel="Artikel scannen" />);
    expect(screen.getByLabelText("Artikel scannen")).toHaveFocus();
  });

  it("uses the given placeholder", () => {
    render(
      <ScannerInput
        onSubmit={vi.fn()}
        loading={false}
        ariaLabel="Artikel scannen"
        placeholder="Scan artikel..."
      />
    );
    expect(screen.getByPlaceholderText("Scan artikel...")).toBeInTheDocument();
  });
});
