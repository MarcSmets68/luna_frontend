import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ReservatieModeTabs } from "../reservatie-mode-tabs";

describe("ReservatieModeTabs", () => {
  it("marks the active tab and switches on click", () => {
    const onChange = vi.fn();
    render(<ReservatieModeTabs mode="direct" onChange={onChange} />);
    expect(screen.getByRole("tablist")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Direct" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Productie" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
    fireEvent.click(screen.getByRole("tab", { name: "Productie" }));
    expect(onChange).toHaveBeenCalledWith("productie");
  });
});
