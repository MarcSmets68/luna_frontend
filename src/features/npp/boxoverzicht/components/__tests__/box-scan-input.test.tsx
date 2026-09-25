import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BoxScanInput } from "../box-scan-input";

describe("BoxScanInput", () => {
  it("auto-focuses the scan field on mount", () => {
    render(<BoxScanInput onSubmitScan={vi.fn()} loading={false} />);
    expect(screen.getByLabelText("Boxlabel scannen")).toHaveFocus();
  });

  it("submits the trimmed value on Enter and clears the field", async () => {
    const user = userEvent.setup();
    const onSubmitScan = vi.fn();
    render(<BoxScanInput onSubmitScan={onSubmitScan} loading={false} />);

    const input = screen.getByLabelText("Boxlabel scannen");
    await user.type(input, "B12345-1{Enter}");

    expect(onSubmitScan).toHaveBeenCalledWith("B12345-1");
    expect(input).toHaveValue("");
  });

  it("does not submit an empty value", async () => {
    const user = userEvent.setup();
    const onSubmitScan = vi.fn();
    render(<BoxScanInput onSubmitScan={onSubmitScan} loading={false} />);

    await user.type(screen.getByLabelText("Boxlabel scannen"), "{Enter}");

    expect(onSubmitScan).not.toHaveBeenCalled();
  });

  it("disables the input and button while loading", () => {
    render(<BoxScanInput onSubmitScan={vi.fn()} loading={true} />);
    expect(screen.getByLabelText("Boxlabel scannen")).toBeDisabled();
    expect(screen.getByRole("button", { name: /Bezig/ })).toBeDisabled();
  });

  it("re-focuses the input once loading finishes (in-place re-scan)", () => {
    const { rerender } = render(<BoxScanInput onSubmitScan={vi.fn()} loading={true} />);
    expect(screen.getByLabelText("Boxlabel scannen")).not.toHaveFocus();

    rerender(<BoxScanInput onSubmitScan={vi.fn()} loading={false} />);
    expect(screen.getByLabelText("Boxlabel scannen")).toHaveFocus();
  });
});
