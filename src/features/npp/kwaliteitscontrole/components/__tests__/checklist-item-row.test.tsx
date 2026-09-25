import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ChecklistItemRow } from "../checklist-item-row";
import type { QcChecklistItem } from "../../types";

const item: QcChecklistItem = {
  lijnnr: 10,
  omschr: "Kleur controle",
  swInfo: false,
  controle: "Te controleren",
  info: "",
};

const swInfoItem: QcChecklistItem = {
  lijnnr: 20,
  omschr: "Bevestiging",
  swInfo: true,
  controle: "Te controleren",
  info: "",
};

describe("ChecklistItemRow", () => {
  it("calls onAnswer immediately for OK on a non-swInfo item", async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();
    render(<ChecklistItemRow item={item} saving={false} error={null} onAnswer={onAnswer} />);

    await user.click(screen.getByRole("button", { name: "OK" }));
    expect(onAnswer).toHaveBeenCalledWith("OK");
  });

  it("calls onAnswer immediately for N.v.t.", async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();
    render(<ChecklistItemRow item={item} saving={false} error={null} onAnswer={onAnswer} />);

    await user.click(screen.getByRole("button", { name: "N.v.t." }));
    expect(onAnswer).toHaveBeenCalledWith("N.v.t.");
  });

  it("calls onAnswer immediately for Fout", async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();
    render(<ChecklistItemRow item={item} saving={false} error={null} onAnswer={onAnswer} />);

    await user.click(screen.getByRole("button", { name: "Fout" }));
    expect(onAnswer).toHaveBeenCalledWith("Fout");
  });

  it("shows an inline info input for OK on a swInfo item and does not answer until confirmed", async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();
    render(<ChecklistItemRow item={swInfoItem} saving={false} error={null} onAnswer={onAnswer} />);

    await user.click(screen.getByRole("button", { name: "OK" }));
    expect(onAnswer).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Info voor Bevestiging")).toBeInTheDocument();

    const submit = screen.getByRole("button", { name: "Bevestigen" });
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText("Info voor Bevestiging"), "Gecontroleerd");
    expect(submit).toBeEnabled();

    await user.click(submit);
    expect(onAnswer).toHaveBeenCalledWith("OK", "Gecontroleerd");
  });

  it("closes the info input without answering when Annuleren is clicked", async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();
    render(<ChecklistItemRow item={swInfoItem} saving={false} error={null} onAnswer={onAnswer} />);

    await user.click(screen.getByRole("button", { name: "OK" }));
    await user.click(screen.getByRole("button", { name: "Annuleren" }));

    expect(onAnswer).not.toHaveBeenCalled();
    expect(screen.queryByLabelText("Info voor Bevestiging")).not.toBeInTheDocument();
  });

  it("disables the buttons while saving", () => {
    render(<ChecklistItemRow item={item} saving={true} error={null} onAnswer={() => {}} />);
    expect(screen.getByRole("group")).toBeInTheDocument();
    for (const button of screen.getAllByRole("button")) {
      expect(button).toBeDisabled();
    }
  });

  it("renders the item error verbatim when present", () => {
    render(
      <ChecklistItemRow
        item={item}
        saving={false}
        error="Sessie is niet meer geldig"
        onAnswer={() => {}}
      />
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Sessie is niet meer geldig");
  });
});
