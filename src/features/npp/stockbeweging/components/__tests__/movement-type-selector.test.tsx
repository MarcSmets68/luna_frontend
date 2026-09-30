import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MovementTypeSelector } from "../movement-type-selector";

describe("MovementTypeSelector", () => {
  it("renders one large touch button per movement type, not a dropdown", () => {
    render(<MovementTypeSelector value={null} onChange={() => {}} />);

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    [
      "Correctie +",
      "Correctie -",
      "Correctie =",
      "Ontvangst",
      "Transfer extern",
      "Transfer intern",
    ].forEach((label) => {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    });
  });

  it("marks the selected type as pressed and calls onChange with the clicked type", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MovementTypeSelector value="ontvangst" onChange={onChange} />);

    expect(screen.getByRole("button", { name: "Ontvangst" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: "Correctie +" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );

    await user.click(screen.getByRole("button", { name: "Transfer intern" }));
    expect(onChange).toHaveBeenCalledWith("transfer_intern");
  });
});
