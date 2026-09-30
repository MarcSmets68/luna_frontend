import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MagazijnInput } from "../magazijn-input";

describe("MagazijnInput", () => {
  it("renders a text input with a max length of 10", () => {
    render(<MagazijnInput value="" onChange={() => {}} />);
    const input = screen.getByLabelText("Nieuw magazijn");
    expect(input).toHaveAttribute("maxlength", "10");
  });
});
