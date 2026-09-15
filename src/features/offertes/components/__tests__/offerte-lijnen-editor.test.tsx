import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OfferteLijnenEditor, type LocalLijn } from "../offerte-lijnen-editor";
import type { OfflijnItem } from "@/lib/api-client";

const createOfflijnMock = vi.fn();
const updateOfflijnMock = vi.fn();
const deleteOfflijnMock = vi.fn();
const reorderOfflijnMock = vi.fn();

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
  it("calls updateOfflijn and reports the updated list on field change", async () => {
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
    // triggers onChange per keystroke; last call carries the final patch
    await waitFor(() => expect(updateOfflijnMock).toHaveBeenCalled());
    expect(updateOfflijnMock.mock.calls.at(-1)?.[0]).toBe(100);
    expect(updateOfflijnMock.mock.calls.at(-1)?.[1]).toBe(1);
    expect(updateOfflijnMock.mock.calls.at(-1)?.[2]).toBe(10);
    await waitFor(() => expect(onLijnenChange).toHaveBeenCalled());
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
});
