import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AfkeurDialog } from "../afkeur-dialog";

describe("AfkeurDialog", () => {
  it("keeps Bevestigen disabled until a non-blank opmerking is entered", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <AfkeurDialog open={true} submitting={false} error={null} onConfirm={onConfirm} onCancel={() => {}} />
    );

    const confirmButton = screen.getByRole("button", { name: "Bevestigen" });
    expect(confirmButton).toBeDisabled();

    await user.type(screen.getByLabelText("Opmerking"), "   ");
    expect(confirmButton).toBeDisabled();

    await user.type(screen.getByLabelText("Opmerking"), "Verkeerde kleur");
    expect(confirmButton).toBeEnabled();

    await user.click(confirmButton);
    expect(onConfirm).toHaveBeenCalledWith("Verkeerde kleur");
  });

  it("calls onCancel and clears the field when Annuleren is clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <AfkeurDialog open={true} submitting={false} error={null} onConfirm={() => {}} onCancel={onCancel} />
    );

    await user.type(screen.getByLabelText("Opmerking"), "Test");
    await user.click(screen.getByRole("button", { name: "Annuleren" }));
    expect(onCancel).toHaveBeenCalled();
  });

  it("renders the error verbatim and disables both buttons while submitting", () => {
    render(
      <AfkeurDialog
        open={true}
        submitting={true}
        error="Sessie is niet meer geldig"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Sessie is niet meer geldig");
    expect(screen.getByRole("button", { name: "Annuleren" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Bezig..." })).toBeDisabled();
  });
});
