import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { QueueListItem } from "../queue-list-item";
import type { QcQueueItem } from "../../types";

const baseItem: QcQueueItem = {
  bonnr: 1001,
  groepnr: 1,
  lijnnr: 10,
  klant: "Jansen",
  profielgroep: "PG1",
  montageDatum: "2026-02-01",
  hasInProgressSession: false,
  inProgressByOther: false,
};

describe("QueueListItem", () => {
  it("renders bonnr/groepnr, klant and profielgroep", () => {
    render(<QueueListItem item={baseItem} starting={false} onStart={() => {}} />);
    expect(screen.getByText("Bon 1001 / 1")).toBeInTheDocument();
    expect(screen.getByText(/Jansen/)).toBeInTheDocument();
    expect(screen.getByText(/PG1/)).toBeInTheDocument();
  });

  it("calls onStart when tapped", async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    render(<QueueListItem item={baseItem} starting={false} onStart={onStart} />);
    await user.click(screen.getByRole("button"));
    expect(onStart).toHaveBeenCalled();
  });

  it("shows a Hervatten badge when hasInProgressSession is true", () => {
    render(
      <QueueListItem
        item={{ ...baseItem, hasInProgressSession: true }}
        starting={false}
        onStart={() => {}}
      />
    );
    expect(screen.getByText("Hervatten")).toBeInTheDocument();
  });

  it("disables the row and shows a badge when inProgressByOther is true", () => {
    render(
      <QueueListItem
        item={{ ...baseItem, inProgressByOther: true }}
        starting={false}
        onStart={() => {}}
      />
    );
    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByText("In bewerking door een andere gebruiker")).toBeInTheDocument();
  });

  it("disables the row and shows a busy label while starting", () => {
    render(<QueueListItem item={baseItem} starting={true} onStart={() => {}} />);
    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByText("Bezig...")).toBeInTheDocument();
  });
});
