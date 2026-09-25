import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SessionRejectedState } from "../session-rejected-state";

describe("SessionRejectedState", () => {
  it("renders the rejected message with no action button", () => {
    render(<SessionRejectedState />);
    expect(screen.getByText("Afgekeurd")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
