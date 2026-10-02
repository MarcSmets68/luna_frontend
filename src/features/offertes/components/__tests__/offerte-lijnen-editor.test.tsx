import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OfferteLijnenEditor, type LocalLijn } from "../offerte-lijnen-editor";
import type { OfflijnItem } from "@/lib/api-client";

const createOfflijnMock = vi.fn();
const updateOfflijnMock = vi.fn();
const deleteOfflijnMock = vi.fn();
const reorderOfflijnMock = vi.fn();
const zoekMock = vi.fn();

vi.mock("../../lib/actions", () => ({
  zoekArtikelenAction: (...args: unknown[]) => zoekMock(...args),
}));

vi.mock("@/lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-client")>("@/lib/api-client");
  return {
    ...actual,
    createOfflijn: (...args: unknown[]) => createOfflijnMock(...args),
    updateOfflijn: (...args: unknown[]) => updateOfflijnMock(...args),
    deleteOfflijn: (...args: unknown[]) => deleteOfflijnMock(...args),
    reorderOfflijn: (...args: unknown[]) => reorderOfflijnMock(...args),
  };
});

beforeEach(() => {
  createOfflijnMock.mockReset();
  updateOfflijnMock.mockReset();
  deleteOfflijnMock.mockReset();
  reorderOfflijnMock.mockReset();
  zoekMock.mockReset();
  zoekMock.mockResolvedValue({ items: [], truncated: false });
  vi.spyOn(window, "confirm").mockReturnValue(true);
});

function makeLocalLijn(overrides: Partial<LocalLijn> = {}): LocalLijn {
  return {
    clientId: "c1",
    artnr: "ABC123",
    omschrijving: "Test artikel",
    omschrijvingOfferte: "Test artikel - offerte",
    aantal: 1,
    teLeveren: 1,
    verkoopprijs: 10,
    brutoVerkoopprijs: 12,
    korting: 0,
    btwKode: "1",
    bedrag: 10,
    bruto: 12,
    aankoopprijs: 5,
    opm: "",
    bestellen: false,
    blokkeren: false,
    subtotaal: false,
    kolomtitel: false,
    infolijn: false,
    ...overrides,
  };
}

function makeOfflijn(overrides: Partial<OfflijnItem> = {}): OfflijnItem {
  return {
    offnr: 100,
    versie: 1,
    lijnnr: 10,
    groepnr: 1,
    subgroepnr: 1,
    artnr: "ABC123",
    omschrijving: "Test artikel",
    omschrijvingOfferte: "Test artikel - offerte",
    aantal: 1,
    teLeveren: 1,
    verkoopprijs: 10,
    brutoVerkoopprijs: 12,
    korting: 0,
    btwKode: "1",
    bedrag: 10,
    bruto: 12,
    aankoopprijs: 5,
    opm: "",
    bestellen: false,
    blokkeren: false,
    subtotaal: false,
    kolomtitel: false,
    infolijn: false,
    ...overrides,
  };
}

describe("OfferteLijnenEditor - local mode", () => {
  it("renders each local line's artnr and omschrijving as editable inputs", () => {
    const onChange = vi.fn();
    render(
      <OfferteLijnenEditor mode="local" lijnen={[makeLocalLijn()]} onChange={onChange} />
    );
    expect(screen.getByDisplayValue("ABC123")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test artikel - offerte")).toBeInTheDocument();
  });

  it("adds a new artikellijn without calling the API", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<OfferteLijnenEditor mode="local" lijnen={[]} onChange={onChange} />);

    await user.type(screen.getByRole("textbox", { name: "Artnr nieuwe lijn" }), "NEW1");
    await user.click(screen.getByRole("button", { name: /lijn toevoegen/i }));

    expect(createOfflijnMock).not.toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledTimes(1);
    const [added] = onChange.mock.calls[0][0] as LocalLijn[];
    expect(added.artnr).toBe("NEW1");
  });

  it("deletes a local line without a confirm prompt", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const confirmSpy = vi.spyOn(window, "confirm");
    render(
      <OfferteLijnenEditor mode="local" lijnen={[makeLocalLijn()]} onChange={onChange} />
    );

    await user.click(screen.getByRole("button", { name: /verwijder lijn/i }));

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("swaps two lines on move down/up as a pure array operation", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const lijnA = makeLocalLijn({ clientId: "a", artnr: "AAA" });
    const lijnB = makeLocalLijn({ clientId: "b", artnr: "BBB" });
    render(<OfferteLijnenEditor mode="local" lijnen={[lijnA, lijnB]} onChange={onChange} />);

    const downButtons = screen.getAllByRole("button", { name: "Omlaag" });
    await user.click(downButtons[0]);

    expect(onChange).toHaveBeenCalledWith([lijnB, lijnA]);
  });

  it("adds a titellijn with only an omschrijving input and artnr K00", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<OfferteLijnenEditor mode="local" lijnen={[]} onChange={onChange} />);

    await user.selectOptions(screen.getByRole("combobox", { name: "Type nieuwe lijn" }), "titel");
    await user.type(screen.getByRole("textbox", { name: "Omschrijving nieuwe lijn" }), "SECTIE A");
    await user.click(screen.getByRole("button", { name: /lijn toevoegen/i }));

    const [added] = onChange.mock.calls[0][0] as LocalLijn[];
    expect(added.artnr).toBe("K00");
    expect(added.omschrijvingOfferte).toBe("SECTIE A");
  });
});

describe("OfferteLijnenEditor - persisted mode", () => {
  it("does not call updateOfflijn while typing - only commits on blur", async () => {
    const user = userEvent.setup();
    const onLijnenChange = vi.fn();
    const lijn = makeOfflijn();
    updateOfflijnMock.mockResolvedValue({ ...lijn, artnr: "NEWART" });

    render(
      <OfferteLijnenEditor
        mode="persisted"
        offnr={100}
        versie={1}
        lijnen={[lijn]}
        onLijnenChange={onLijnenChange}
      />
    );

    const artnrInput = screen.getByRole("textbox", { name: /artnr lijn/i });
    await user.clear(artnrInput);
    await user.type(artnrInput, "NEWART");

    // Every keystroke only updates the local, uncommitted value - no PUT
    // call yet, and the displayed value reflects what was typed.
    expect(updateOfflijnMock).not.toHaveBeenCalled();
    expect(onLijnenChange).not.toHaveBeenCalled();
    expect(artnrInput).toHaveValue("NEWART");
  });

  it("commits exactly once, with the new value, when the field is blurred after a change", async () => {
    const user = userEvent.setup();
    const onLijnenChange = vi.fn();
    const lijn = makeOfflijn();
    updateOfflijnMock.mockResolvedValue({ ...lijn, artnr: "NEWART" });

    render(
      <OfferteLijnenEditor
        mode="persisted"
        offnr={100}
        versie={1}
        lijnen={[lijn]}
        onLijnenChange={onLijnenChange}
      />
    );

    const artnrInput = screen.getByRole("textbox", { name: /artnr lijn/i });
    await user.clear(artnrInput);
    await user.type(artnrInput, "NEWART");
    await user.tab(); // blur

    await waitFor(() => expect(updateOfflijnMock).toHaveBeenCalledTimes(1));
    expect(updateOfflijnMock).toHaveBeenCalledWith(100, 1, 10, { artnr: "NEWART" });
    await waitFor(() => expect(onLijnenChange).toHaveBeenCalledTimes(1));
  });

  it("does not call updateOfflijn on blur when the field's value did not change", async () => {
    const user = userEvent.setup();
    const onLijnenChange = vi.fn();
    const lijn = makeOfflijn();

    render(
      <OfferteLijnenEditor
        mode="persisted"
        offnr={100}
        versie={1}
        lijnen={[lijn]}
        onLijnenChange={onLijnenChange}
      />
    );

    const artnrInput = screen.getByRole("textbox", { name: /artnr lijn/i });
    await user.click(artnrInput);
    await user.tab(); // focus then blur, no edit

    expect(updateOfflijnMock).not.toHaveBeenCalled();
    expect(onLijnenChange).not.toHaveBeenCalled();
  });

  it("re-syncs an untouched field's displayed value when the lijnen prop changes externally", async () => {
    const onLijnenChange = vi.fn();
    const lijn = makeOfflijn({ artnr: "OLD1" });

    const { rerender } = render(
      <OfferteLijnenEditor
        mode="persisted"
        offnr={100}
        versie={1}
        lijnen={[lijn]}
        onLijnenChange={onLijnenChange}
      />
    );

    expect(screen.getByRole("textbox", { name: /artnr lijn/i })).toHaveValue("OLD1");

    // Simulate the parent replacing the list after e.g. a different field's
    // successful server round-trip or a reorder response.
    const updatedLijn = { ...lijn, artnr: "SYNCED" };
    rerender(
      <OfferteLijnenEditor
        mode="persisted"
        offnr={100}
        versie={1}
        lijnen={[updatedLijn]}
        onLijnenChange={onLijnenChange}
      />
    );

    expect(screen.getByRole("textbox", { name: /artnr lijn/i })).toHaveValue("SYNCED");
  });

  it("asks for confirmation before deleting a persisted line and deletes on confirm", async () => {
    const user = userEvent.setup();
    const onLijnenChange = vi.fn();
    const lijn = makeOfflijn();
    deleteOfflijnMock.mockResolvedValue({ status: "deleted", offnr: 100, versie: 1, lijnnr: 10 });

    render(
      <OfferteLijnenEditor
        mode="persisted"
        offnr={100}
        versie={1}
        lijnen={[lijn]}
        onLijnenChange={onLijnenChange}
      />
    );

    await user.click(screen.getByRole("button", { name: /verwijder lijn/i }));

    expect(window.confirm).toHaveBeenCalledWith(
      "Lijn verwijderen? Dit kan niet ongedaan worden gemaakt."
    );
    await waitFor(() => expect(deleteOfflijnMock).toHaveBeenCalledWith(100, 1, 10));
    await waitFor(() => expect(onLijnenChange).toHaveBeenCalledWith([]));
  });

  it("does not delete when the confirm dialog is cancelled", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const onLijnenChange = vi.fn();
    const lijn = makeOfflijn();

    render(
      <OfferteLijnenEditor
        mode="persisted"
        offnr={100}
        versie={1}
        lijnen={[lijn]}
        onLijnenChange={onLijnenChange}
      />
    );

    await user.click(screen.getByRole("button", { name: /verwijder lijn/i }));

    expect(deleteOfflijnMock).not.toHaveBeenCalled();
    expect(onLijnenChange).not.toHaveBeenCalled();
  });

  it("calls reorderOfflijn and replaces the list with the full reordered response", async () => {
    const user = userEvent.setup();
    const onLijnenChange = vi.fn();
    const lijnA = makeOfflijn({ lijnnr: 10, artnr: "AAA" });
    const lijnB = makeOfflijn({ lijnnr: 20, artnr: "BBB" });
    reorderOfflijnMock.mockResolvedValue([lijnB, lijnA]);

    render(
      <OfferteLijnenEditor
        mode="persisted"
        offnr={100}
        versie={1}
        lijnen={[lijnA, lijnB]}
        onLijnenChange={onLijnenChange}
      />
    );

    const downButtons = screen.getAllByRole("button", { name: "Omlaag" });
    await user.click(downButtons[0]);

    await waitFor(() => expect(reorderOfflijnMock).toHaveBeenCalledWith(100, 1, 10, "down"));
    await waitFor(() => expect(onLijnenChange).toHaveBeenCalledWith([lijnB, lijnA]));
  });

  it("shows a readable error and leaves the list untouched when the reorder guard rejects", async () => {
    const user = userEvent.setup();
    const onLijnenChange = vi.fn();
    const lijn = makeOfflijn();
    reorderOfflijnMock.mockRejectedValue(
      new Error("Cannot move a subtotaal line upward above the lines it sums")
    );

    render(
      <OfferteLijnenEditor
        mode="persisted"
        offnr={100}
        versie={1}
        lijnen={[lijn, makeOfflijn({ lijnnr: 20 })]}
        onLijnenChange={onLijnenChange}
      />
    );

    const upButtons = screen.getAllByRole("button", { name: "Omhoog" });
    await user.click(upButtons[1]);

    expect(
      await screen.findByText("Cannot move a subtotaal line upward above the lines it sums")
    ).toBeInTheDocument();
    expect(onLijnenChange).not.toHaveBeenCalled();
  });

  it("disables the up button on the first row and the down button on the last row", () => {
    const onLijnenChange = vi.fn();
    render(
      <OfferteLijnenEditor
        mode="persisted"
        offnr={100}
        versie={1}
        lijnen={[makeOfflijn({ lijnnr: 10 }), makeOfflijn({ lijnnr: 20 })]}
        onLijnenChange={onLijnenChange}
      />
    );

    const upButtons = screen.getAllByRole("button", { name: "Omhoog" });
    const downButtons = screen.getAllByRole("button", { name: "Omlaag" });
    expect(upButtons[0]).toBeDisabled();
    expect(downButtons[1]).toBeDisabled();
  });

  it("adds a new persisted artikellijn via createOfflijn and appends the server response to the list", async () => {
    const user = userEvent.setup();
    const onLijnenChange = vi.fn();
    const lijn = makeOfflijn();
    const created = makeOfflijn({ lijnnr: 20, artnr: "NEW1" });
    createOfflijnMock.mockResolvedValue(created);

    render(
      <OfferteLijnenEditor
        mode="persisted"
        offnr={100}
        versie={1}
        lijnen={[lijn]}
        onLijnenChange={onLijnenChange}
      />
    );

    await user.type(screen.getByRole("textbox", { name: "Artnr nieuwe lijn" }), "NEW1");
    await user.click(screen.getByRole("button", { name: /lijn toevoegen/i }));

    await waitFor(() => expect(createOfflijnMock).toHaveBeenCalledTimes(1));
    expect(createOfflijnMock).toHaveBeenCalledWith(
      100,
      1,
      expect.objectContaining({ artnr: "NEW1", subtotaal: false, kolomtitel: false, infolijn: false })
    );
    await waitFor(() => expect(onLijnenChange).toHaveBeenCalledWith([lijn, created]));
  });

  it("sends only the subtotaal flag (mutually exclusive with kolomtitel/infolijn) when adding a subtotaal line", async () => {
    const user = userEvent.setup();
    const onLijnenChange = vi.fn();
    const lijn = makeOfflijn();
    createOfflijnMock.mockResolvedValue(makeOfflijn({ lijnnr: 20, subtotaal: true }));

    render(
      <OfferteLijnenEditor
        mode="persisted"
        offnr={100}
        versie={1}
        lijnen={[lijn]}
        onLijnenChange={onLijnenChange}
      />
    );

    await user.selectOptions(screen.getByRole("combobox", { name: "Type nieuwe lijn" }), "subtotaal");
    await user.type(screen.getByRole("textbox", { name: "Omschrijving nieuwe lijn" }), "Subtotaal groep A");
    await user.click(screen.getByRole("button", { name: /lijn toevoegen/i }));

    await waitFor(() => expect(createOfflijnMock).toHaveBeenCalledTimes(1));
    expect(createOfflijnMock).toHaveBeenCalledWith(
      100,
      1,
      expect.objectContaining({ subtotaal: true, kolomtitel: false, infolijn: false })
    );
  });

  it("shows the server's mutual-exclusivity/precondition error verbatim and does not update the list when adding a line fails", async () => {
    const user = userEvent.setup();
    const onLijnenChange = vi.fn();
    const lijn = makeOfflijn();
    createOfflijnMock.mockRejectedValue(
      new Error("Een subtotaallijn vereist een voorgaande gewone lijn")
    );

    render(
      <OfferteLijnenEditor
        mode="persisted"
        offnr={100}
        versie={1}
        lijnen={[lijn]}
        onLijnenChange={onLijnenChange}
      />
    );

    await user.selectOptions(screen.getByRole("combobox", { name: "Type nieuwe lijn" }), "subtotaal");
    await user.click(screen.getByRole("button", { name: /lijn toevoegen/i }));

    expect(
      await screen.findByText("Een subtotaallijn vereist een voorgaande gewone lijn")
    ).toBeInTheDocument();
    expect(onLijnenChange).not.toHaveBeenCalled();
  });

  it("shows a readable error and leaves the list untouched when updating a persisted line fails", async () => {
    const user = userEvent.setup();
    const onLijnenChange = vi.fn();
    const lijn = makeOfflijn();
    updateOfflijnMock.mockRejectedValue(new Error("Offlijn 100/1/10 not found"));

    render(
      <OfferteLijnenEditor
        mode="persisted"
        offnr={100}
        versie={1}
        lijnen={[lijn]}
        onLijnenChange={onLijnenChange}
      />
    );

    const artnrInput = screen.getByRole("textbox", { name: /artnr lijn/i });
    await user.type(artnrInput, "X");
    await user.tab(); // blur triggers the commit attempt

    expect(await screen.findByText("Offlijn 100/1/10 not found")).toBeInTheDocument();
    expect(onLijnenChange).not.toHaveBeenCalled();
    // The user's unsaved edit is not silently reverted to the stale server
    // value - it stays visible alongside the error message.
    expect(artnrInput).toHaveValue(`${lijn.artnr}X`);
  });

  it("shows a readable error and leaves the list untouched when deleting a persisted line fails", async () => {
    const user = userEvent.setup();
    const onLijnenChange = vi.fn();
    const lijn = makeOfflijn();
    deleteOfflijnMock.mockRejectedValue(new Error("Offlijn 100/1/10 not found"));

    render(
      <OfferteLijnenEditor
        mode="persisted"
        offnr={100}
        versie={1}
        lijnen={[lijn]}
        onLijnenChange={onLijnenChange}
      />
    );

    await user.click(screen.getByRole("button", { name: /verwijder lijn/i }));

    expect(await screen.findByText("Offlijn 100/1/10 not found")).toBeInTheDocument();
    expect(onLijnenChange).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Artikel lookup
// ---------------------------------------------------------------------------

const LED = {
  artnr: "LED100",
  omschrijvingNl: "Led strip NL",
  omschrijvingFr: "Led strip FR",
  verkoopprijs: 25,
  aankoopprijs: 12,
};
const SPOT = {
  artnr: "LED200",
  omschrijvingNl: "",
  omschrijvingFr: "Spot FR",
  verkoopprijs: 40,
  aankoopprijs: 20,
};
const FIVE = ["artnr", "omschrijving", "omschrijvingOfferte", "verkoopprijs", "aankoopprijs"];

function LocalHarness({
  initial = [],
  spy,
}: {
  initial?: LocalLijn[];
  spy?: (l: LocalLijn[]) => void;
}) {
  const [lijnen, setLijnen] = useState(initial);
  return (
    <OfferteLijnenEditor
      mode="local"
      lijnen={lijnen}
      onChange={(next) => {
        spy?.(next);
        setLijnen(next);
      }}
    />
  );
}

function PersistedHarness({ lijn, onLijnenChange }: { lijn: OfflijnItem; onLijnenChange?: () => void }) {
  return (
    <OfferteLijnenEditor
      mode="persisted"
      offnr={100}
      versie={1}
      lijnen={[lijn]}
      onLijnenChange={onLijnenChange ?? vi.fn()}
    />
  );
}

describe("OfferteLijnenEditor - artikel lookup", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  // Real timers: RTL/user-event hang under vi fake timers here, so the
  // 300ms debounce is waited out for real (plus a margin).
  async function advance(ms = 350) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, ms));
    });
  }
  const newArtnr = () => screen.getByRole("textbox", { name: "Artnr nieuwe lijn" });
  const val = (name: string) => (screen.getByLabelText(name) as HTMLInputElement).value;

  it("does not search below 2 chars and searches once after the debounce at 2+", async () => {
    render(<LocalHarness />);
    await user.type(newArtnr(), "L");
    await advance();
    expect(zoekMock).not.toHaveBeenCalled();
    await user.type(newArtnr(), "E");
    expect(zoekMock).not.toHaveBeenCalled();
    await advance();
    expect(zoekMock).toHaveBeenCalledTimes(1);
    expect(zoekMock).toHaveBeenCalledWith("LE");
  });

  it("debounces rapid typing into a single call with the final term", async () => {
    render(<LocalHarness />);
    await user.type(newArtnr(), "LED10");
    await advance();
    expect(zoekMock).toHaveBeenCalledTimes(1);
    expect(zoekMock).toHaveBeenCalledWith("LED10");
  });

  it("new line: picking prefills exactly the five fields and leaves others untouched", async () => {
    zoekMock.mockResolvedValue({ items: [LED], truncated: false });
    const spy = vi.fn();
    render(<LocalHarness spy={spy} />);
    await user.type(screen.getByLabelText("Aantal nieuwe lijn"), "3");
    await user.type(newArtnr(), "LED");
    await advance();
    await user.click(screen.getByRole("option", { name: /LED100/ }));

    expect(val("Artnr nieuwe lijn")).toBe("LED100");
    expect(val("Omschrijving nieuwe lijn")).toBe("Led strip NL");
    expect(val("Vprijs nieuwe lijn")).toBe("25");
    expect(val("Aankoopprijs nieuwe lijn")).toBe("12");
    expect(Number(val("Aantal nieuwe lijn"))).toBe(3);
    expect(val("Bedrag nieuwe lijn")).toBe("0");
    expect(val("Korting nieuwe lijn")).toBe("0");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /lijn toevoegen/i }));
    const [added] = spy.mock.calls[0][0] as LocalLijn[];
    expect(added).toMatchObject({
      artnr: "LED100",
      omschrijving: "Led strip NL",
      omschrijvingOfferte: "Led strip NL",
      verkoopprijs: 25,
      aankoopprijs: 12,
      btwKode: "",
      brutoVerkoopprijs: 0,
      bruto: 0,
    });
  });

  it("new line: manual edits after prefill stick and the dropdown stays closed", async () => {
    zoekMock.mockResolvedValue({ items: [LED], truncated: false });
    render(<LocalHarness />);
    await user.type(newArtnr(), "LED");
    await advance();
    await user.click(screen.getByRole("option", { name: /LED100/ }));
    const omschr = screen.getByLabelText("Omschrijving nieuwe lijn");
    await user.clear(omschr);
    await user.type(omschr, "Eigen tekst");
    await advance();
    expect(val("Omschrijving nieuwe lijn")).toBe("Eigen tekst");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(zoekMock).toHaveBeenCalledTimes(1);
  });

  it("new line: picking a second article overwrites the five fields again", async () => {
    zoekMock.mockResolvedValue({ items: [LED, SPOT], truncated: false });
    render(<LocalHarness />);
    await user.type(newArtnr(), "LED");
    await advance();
    await user.click(screen.getByRole("option", { name: /LED100/ }));
    await user.type(newArtnr(), "2");
    await advance();
    await user.click(screen.getByRole("option", { name: /LED200/ }));
    expect(val("Artnr nieuwe lijn")).toBe("LED200");
    expect(val("Omschrijving nieuwe lijn")).toBe("Spot FR");
    expect(val("Vprijs nieuwe lijn")).toBe("40");
    expect(val("Aankoopprijs nieuwe lijn")).toBe("20");
  });

  it("shows an empty state and still adds a free-text artnr unchanged", async () => {
    const spy = vi.fn();
    render(<LocalHarness spy={spy} />);
    await user.type(newArtnr(), "VRIJ1");
    await advance();
    expect(screen.getByText("Geen artikelen gevonden")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /lijn toevoegen/i }));
    expect((spy.mock.calls[0][0] as LocalLijn[])[0].artnr).toBe("VRIJ1");
  });

  it("shows the truncated hint", async () => {
    zoekMock.mockResolvedValue({ items: [LED], truncated: true });
    render(<LocalHarness />);
    await user.type(newArtnr(), "LED");
    await advance();
    expect(screen.getByText(/verfijn je zoekopdracht/)).toBeInTheDocument();
  });

  it("shows 'Zoeken mislukt' on error without breaking the editor", async () => {
    zoekMock.mockRejectedValue(new Error("boom"));
    const spy = vi.fn();
    render(<LocalHarness spy={spy} />);
    await user.type(newArtnr(), "LED");
    await advance();
    expect(screen.getByText("Zoeken mislukt")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /lijn toevoegen/i }));
    expect((spy.mock.calls[0][0] as LocalLijn[])[0].artnr).toBe("LED");
  });

  it("ignores an older response that resolves after a newer one", async () => {
    let resolveOld!: (v: unknown) => void;
    zoekMock
      .mockImplementationOnce(() => new Promise((r) => (resolveOld = r)))
      .mockResolvedValueOnce({ items: [SPOT], truncated: false });
    render(<LocalHarness />);
    await user.type(newArtnr(), "LED");
    await advance();
    await user.type(newArtnr(), "2");
    await advance();
    expect(screen.getByRole("option", { name: /LED200/ })).toBeInTheDocument();
    await act(async () => {
      resolveOld({ items: [LED], truncated: false });
    });
    expect(screen.queryByRole("option", { name: /LED100/ })).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: /LED200/ })).toBeInTheDocument();
  });

  it("local mode, existing row: pick calls onChange once with all five fields; other rows untouched", async () => {
    zoekMock.mockResolvedValue({ items: [LED], truncated: false });
    const spy = vi.fn();
    const a = makeLocalLijn({ clientId: "a", artnr: "AAA", btwKode: "21" });
    const b = makeLocalLijn({ clientId: "b", artnr: "BBB" });
    render(<LocalHarness initial={[a, b]} spy={spy} />);
    const input = screen.getByRole("textbox", { name: "Artnr lijn 10" });
    await user.clear(input);
    await user.type(input, "LED");
    spy.mockClear();
    await advance();
    await user.click(screen.getByRole("option", { name: /LED100/ }));

    expect(spy).toHaveBeenCalledTimes(1);
    const next = spy.mock.calls[0][0] as LocalLijn[];
    expect(next[0]).toMatchObject({
      artnr: "LED100",
      omschrijving: "Led strip NL",
      omschrijvingOfferte: "Led strip NL",
      verkoopprijs: 25,
      aankoopprijs: 12,
      btwKode: "21",
    });
    expect(next[1]).toBe(b);
  });

  it("persisted mode, existing row: pick commits once with the five-field patch", async () => {
    zoekMock.mockResolvedValue({ items: [LED], truncated: false });
    const lijn = makeOfflijn();
    updateOfflijnMock.mockResolvedValue({ ...lijn, artnr: "LED100" });
    const onLijnenChange = vi.fn();
    render(<PersistedHarness lijn={lijn} onLijnenChange={onLijnenChange} />);
    const input = screen.getByRole("textbox", { name: /artnr lijn/i });
    await user.clear(input);
    await user.type(input, "LED");
    await advance();
    await user.click(screen.getByRole("option", { name: /LED100/ }));
    await advance(30);

    expect(updateOfflijnMock).toHaveBeenCalledTimes(1);
    const patch = updateOfflijnMock.mock.calls[0][3];
    expect(Object.keys(patch).sort()).toEqual([...FIVE].sort());
    expect(patch.artnr).toBe("LED100");
    expect(onLijnenChange).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("persisted mode, failed commit: shows the error and keeps the picked value", async () => {
    zoekMock.mockResolvedValue({ items: [LED], truncated: false });
    const lijn = makeOfflijn();
    updateOfflijnMock.mockRejectedValue(new Error("Opslaan mislukt"));
    render(<PersistedHarness lijn={lijn} />);
    const input = screen.getByRole("textbox", { name: /artnr lijn/i });
    await user.clear(input);
    await user.type(input, "LED");
    await advance();
    await user.click(screen.getByRole("option", { name: /LED100/ }));
    await advance(30);

    expect(screen.getByText("Opslaan mislukt")).toBeInTheDocument();
    expect(input).toHaveValue("LED100");
    expect(updateOfflijnMock).toHaveBeenCalledTimes(1);
  });

  it.each(["titel", "subtotaal", "kolomtitel", "infolijn"] as const)(
    "new-line type %s renders no artnr input or lookup",
    async (kind) => {
      render(<LocalHarness />);
      await user.selectOptions(screen.getByRole("combobox", { name: "Type nieuwe lijn" }), kind);
      expect(screen.queryByRole("textbox", { name: "Artnr nieuwe lijn" })).not.toBeInTheDocument();
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    }
  );

  it("existing non-artikel rows render no artnr input", () => {
    const titel = makeLocalLijn({ clientId: "t", artnr: "K00", omschrijving: "Sectie" });
    render(<LocalHarness initial={[titel]} />);
    expect(screen.queryByRole("textbox", { name: /^Artnr lijn/ })).not.toBeInTheDocument();
  });

  it("Escape closes the dropdown", async () => {
    zoekMock.mockResolvedValue({ items: [LED], truncated: false });
    render(<LocalHarness />);
    await user.type(newArtnr(), "LED");
    await advance();
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("ArrowDown + Enter selects the highlighted item", async () => {
    zoekMock.mockResolvedValue({ items: [LED, SPOT], truncated: false });
    render(<LocalHarness />);
    await user.type(newArtnr(), "LED");
    await advance();
    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");
    expect(val("Artnr nieuwe lijn")).toBe("LED200");
    expect(val("Omschrijving nieuwe lijn")).toBe("Spot FR");
  });

  it("Enter without a highlighted item does not select; persisted Enter still commits the typed value", async () => {
    zoekMock.mockResolvedValue({ items: [LED], truncated: false });
    const lijn = makeOfflijn();
    updateOfflijnMock.mockResolvedValue({ ...lijn, artnr: "LEDX" });
    render(<PersistedHarness lijn={lijn} />);
    const input = screen.getByRole("textbox", { name: /artnr lijn/i });
    await user.clear(input);
    await user.type(input, "LEDX");
    await advance();
    await user.keyboard("{Enter}");
    await advance(30);
    expect(updateOfflijnMock).toHaveBeenCalledTimes(1);
    expect(updateOfflijnMock).toHaveBeenCalledWith(100, 1, 10, { artnr: "LEDX" });
  });
});
