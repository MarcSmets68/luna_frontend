import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DevUsersPage } from "../dev-users-page";
import type { DevUserItem } from "@/lib/api-client";

const mockItems: DevUserItem[] = [
  { kode: "MARC", naam: "Marc Smets", email: "marc@nomaled.be", niveau: 9, passief: false },
  { kode: "JAN", naam: "Jan Peeters", email: "jan@nomaled.be", niveau: 3, passief: true },
  { kode: "", naam: "", email: "onbekend@nomaled.be", niveau: 1, passief: false },
];

describe("DevUsersPage", () => {
  it("renders a row for every item", () => {
    render(<DevUsersPage items={mockItems} />);
    expect(screen.getByText("MARC")).toBeInTheDocument();
    expect(screen.getByText("Marc Smets")).toBeInTheDocument();
    expect(screen.getByText("JAN")).toBeInTheDocument();
    expect(screen.getByText("Jan Peeters")).toBeInTheDocument();
  });

  it("renders Active for passief=false and Inactive for passief=true", () => {
    render(<DevUsersPage items={mockItems} />);
    const activeCells = screen.getAllByText("Active");
    const inactiveCells = screen.getAllByText("Inactive");
    expect(activeCells).toHaveLength(2);
    expect(inactiveCells).toHaveLength(1);
  });

  it('renders "—" placeholders for empty kode/naam values', () => {
    render(<DevUsersPage items={mockItems} />);
    const placeholders = screen.getAllByText("\u2014");
    expect(placeholders).toHaveLength(2);
  });

  it("renders every item's niveau and email", () => {
    render(<DevUsersPage items={mockItems} />);
    expect(screen.getByText("9")).toBeInTheDocument();
    expect(screen.getByText("marc@nomaled.be")).toBeInTheDocument();
  });

  it("shows an empty state when there are no items", () => {
    render(<DevUsersPage items={[]} />);
    expect(screen.getByText("Geen users gevonden.")).toBeInTheDocument();
  });
});

