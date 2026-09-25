import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SessionCompleteState } from "../session-complete-state";

describe("SessionCompleteState", () => {
  it("renders the completion message with no action button", () => {
    render(<SessionCompleteState />);
    expect(screen.getByText("Alles gecontroleerd - wordt afgesloten...")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
