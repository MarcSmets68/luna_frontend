import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { OrderLijnenEditor, type LocalLijn } from "../order-lijnen-editor";

function makeLocalLijn(overrides: Partial<LocalLijn> = {}): LocalLijn {
  return {
    clientId: "c1",
    artnr: "ABC123",
    omschrijving: "Test artikel",
    aantal: 1,
    teLeveren: 1,
    vprijs: 10,
    korting: 0,
    btwKode: "1",
    bedrag: 10,
    levDatum: "",
    opm: "",
    subtotaal: false,
    kolomtitel: false,
    infolijn: false,
    ...overrides,
  };
}

describe("OrderLijnenEditor", () => {
  it("renders each line's artnr and omschrijving as editable inputs", () => {
    const onChange = vi.fn();
    render(<OrderLijnenEditor lijnen={[makeLocalLijn()]} onChange={onChange} />);
    expect(screen.getByDisplayValue("ABC123")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test artikel")).toBeInTheDocument();
  });

  it("adds a new artikellijn", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<OrderLijnenEditor lijnen={[]} onChange={onChange} />);

    await user.type(screen.getByRole("textbox", { name: "Artnr nieuwe lijn" }), "NEW1");
    await user.type(screen.getByRole("textbox", { name: "Omschrijving nieuwe lijn" }), "Nieuw artikel");
    await user.click(screen.getByRole("button", { name: /lijn toevoegen/i }));

    expect(onChange).toHaveBeenCalledTimes(1);
    const [added] = onChange.mock.calls[0][0] as LocalLijn[];
    expect(added.artnr).toBe("NEW1");
    expect(added.omschrijving).toBe("Nieuw artikel");
    expect(added.subtotaal).toBe(false);
  });

  it("adds a subtotaal line with only an omschrijving input and the subtotaal flag set", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<OrderLijnenEditor lijnen={[]} onChange={onChange} />);

    await user.selectOptions(screen.getByRole("combobox", { name: "Type nieuwe lijn" }), "subtotaal");
    await user.type(screen.getByRole("textbox", { name: "Omschrijving nieuwe lijn" }), "Subtotaal groep A");
    await user.click(screen.getByRole("button", { name: /lijn toevoegen/i }));

    const [added] = onChange.mock.calls[0][0] as LocalLijn[];
    expect(added.subtotaal).toBe(true);
    expect(added.omschrijving).toBe("Subtotaal groep A");
  });

  it("adds a titellijn with artnr K00", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<OrderLijnenEditor lijnen={[]} onChange={onChange} />);

    await user.selectOptions(screen.getByRole("combobox", { name: "Type nieuwe lijn" }), "titel");
    await user.type(screen.getByRole("textbox", { name: "Omschrijving nieuwe lijn" }), "SECTIE A");
    await user.click(screen.getByRole("button", { name: /lijn toevoegen/i }));

    const [added] = onChange.mock.calls[0][0] as LocalLijn[];
    expect(added.artnr).toBe("K00");
    expect(added.omschrijving).toBe("SECTIE A");
  });

  it("deletes a line", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<OrderLijnenEditor lijnen={[makeLocalLijn()]} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: /verwijder lijn/i }));

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("swaps two lines on move down/up as a pure array operation", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const lijnA = makeLocalLijn({ clientId: "a", artnr: "AAA" });
    const lijnB = makeLocalLijn({ clientId: "b", artnr: "BBB" });
    render(<OrderLijnenEditor lijnen={[lijnA, lijnB]} onChange={onChange} />);

    const downButtons = screen.getAllByRole("button", { name: "Omlaag" });
    await user.click(downButtons[0]);

    expect(onChange).toHaveBeenCalledWith([lijnB, lijnA]);
  });

  it("moves a line back up", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const lijnA = makeLocalLijn({ clientId: "a", artnr: "AAA" });
    const lijnB = makeLocalLijn({ clientId: "b", artnr: "BBB" });
    render(<OrderLijnenEditor lijnen={[lijnA, lijnB]} onChange={onChange} />);

    const upButtons = screen.getAllByRole("button", { name: "Omhoog" });
    await user.click(upButtons[1]);

    expect(onChange).toHaveBeenCalledWith([lijnB, lijnA]);
  });

  it("disables the up button on the first row and the down button on the last row", () => {
    const onChange = vi.fn();
    render(
      <OrderLijnenEditor
        lijnen={[makeLocalLijn({ clientId: "a" }), makeLocalLijn({ clientId: "b" })]}
        onChange={onChange}
      />
    );

    const upButtons = screen.getAllByRole("button", { name: "Omhoog" });
    const downButtons = screen.getAllByRole("button", { name: "Omlaag" });
    expect(upButtons[0]).toBeDisabled();
    expect(downButtons[1]).toBeDisabled();
  });

  it("sums the bedrag of non-subtotaal/kolomtitel/infolijn lines correctly when passed to onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const lijnA = makeLocalLijn({ clientId: "a", bedrag: 10 });
    render(<OrderLijnenEditor lijnen={[lijnA]} onChange={onChange} />);

    await user.type(screen.getByRole("textbox", { name: "Artnr nieuwe lijn" }), "NEW1");
    await user.click(screen.getByRole("button", { name: /lijn toevoegen/i }));

    const passedLijnen = onChange.mock.calls[0][0] as LocalLijn[];
    const total = passedLijnen
      .filter((l) => !l.subtotaal && !l.kolomtitel && !l.infolijn)
      .reduce((sum, l) => sum + l.bedrag, 0);
    expect(total).toBe(10);
  });
});
