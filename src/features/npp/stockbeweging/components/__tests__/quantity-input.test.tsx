import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { QuantityInput } from "../quantity-input";

describe("QuantityInput", () => {
  it("renders a numeric input and reports changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<QuantityInput value="" onChange={onChange} />);

    const input = screen.getByLabelText("Aantal");
    expect(input).toHaveAttribute("type", "number");

    await user.type(input, "5");
    expect(onChange).toHaveBeenCalled();
  });
});
