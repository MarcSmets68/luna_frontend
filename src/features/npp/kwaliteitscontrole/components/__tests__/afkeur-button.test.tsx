import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AfkeurButton } from "../afkeur-button";

describe("AfkeurButton", () => {
  it("is always enabled and calls onClick when tapped", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<AfkeurButton onClick={onClick} />);

    const button = screen.getByRole("button", { name: /Afkeuren/ });
    expect(button).toBeEnabled();
    await user.click(button);
    expect(onClick).toHaveBeenCalled();
  });
});
