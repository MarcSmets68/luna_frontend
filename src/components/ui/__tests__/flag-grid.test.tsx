import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FlagGrid } from "../flag-grid";

describe("FlagGrid", () => {
  it("renders the optional title", () => {
    render(
      <FlagGrid
        title="Kenmerken"
        items={[{ key: "geblokkeerd", label: "Geblokkeerd", checked: false, onToggle: vi.fn() }]}
      />
    );
    expect(screen.getByText("Kenmerken")).toBeInTheDocument();
  });

  it("renders a checkbox per item with its label", () => {
    render(
      <FlagGrid
        items={[
          { key: "geblokkeerd", label: "Geblokkeerd", checked: false, onToggle: vi.fn() },
          { key: "vip", label: "VIP", checked: true, onToggle: vi.fn() },
        ]}
      />
    );
    expect(screen.getByRole("checkbox", { name: "Geblokkeerd" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "VIP" })).toBeChecked();
  });

  it("calls onToggle when a checkbox is clicked", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(
      <FlagGrid items={[{ key: "geblokkeerd", label: "Geblokkeerd", checked: false, onToggle }]} />
    );
    await user.click(screen.getByRole("checkbox", { name: "Geblokkeerd" }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("disables the checkbox when disabled is true", () => {
    render(
      <FlagGrid
        items={[
          { key: "geblokkeerd", label: "Geblokkeerd", checked: false, onToggle: vi.fn(), disabled: true },
        ]}
      />
    );
    expect(screen.getByRole("checkbox", { name: "Geblokkeerd" })).toHaveAttribute(
      "aria-disabled",
      "true"
    );
  });
});

