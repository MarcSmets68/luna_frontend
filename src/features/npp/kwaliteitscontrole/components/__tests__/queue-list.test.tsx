import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { QueueList } from "../queue-list";
import type { QcQueueItem } from "../../types";

const item: QcQueueItem = {
  bonnr: 1001,
  groepnr: 1,
  lijnnr: 10,
  klant: "Jansen",
  profielgroep: "PG1",
  montageDatum: "2026-02-01",
  hasInProgressSession: false,
  inProgressByOther: false,
};

describe("QueueList", () => {
  it("shows a loading message while loading with no items yet", () => {
    render(<QueueList items={null} loading={true} startingKey={null} onStart={() => {}} />);
    expect(screen.getByText("Wachtrij wordt geladen...")).toBeInTheDocument();
  });

  it("shows an empty state when the queue has no items", () => {
    render(<QueueList items={[]} loading={false} startingKey={null} onStart={() => {}} />);
    expect(screen.getByText("Niets te controleren")).toBeInTheDocument();
  });

  it("renders one row per item and forwards onStart", async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    render(<QueueList items={[item]} loading={false} startingKey={null} onStart={onStart} />);

    expect(screen.getByText("Bon 1001 / 1")).toBeInTheDocument();
    await user.click(screen.getByRole("button"));
    expect(onStart).toHaveBeenCalledWith(item);
  });

  it("marks only the matching row as starting", () => {
    render(
      <QueueList items={[item]} loading={false} startingKey="1001-1" onStart={() => {}} />
    );
    expect(screen.getByText("Bezig...")).toBeInTheDocument();
  });
});
