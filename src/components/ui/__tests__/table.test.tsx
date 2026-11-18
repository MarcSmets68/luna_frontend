import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../table";

function Example({ mobileLabel }: { mobileLabel?: string }) {
  return (
    <Table mobileLabel={mobileLabel}>
      <TableHeader><TableRow><TableHead>Artikel</TableHead><TableHead mobileHidden>Groep</TableHead></TableRow></TableHeader>
      <TableBody><TableRow><TableCell>ART-001</TableCell><TableCell mobileHidden>LED</TableCell></TableRow></TableBody>
    </Table>
  );
}

describe("responsive Table", () => {
  it("leaves unconfigured tables unchanged, including offer-detail consumers", () => {
    render(<Example />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    expect(screen.getByRole("table")).not.toHaveAttribute("data-mobile-columns");
    expect(screen.getAllByRole("columnheader")).toHaveLength(2);
    expect(screen.getByText("LED")).toBeInTheDocument();
  });

  it("marks the same secondary column in the heading and body, never the row identity", () => {
    render(<Example mobileLabel="Artikelen" />);
    expect(screen.getByRole("table")).toHaveAttribute("data-mobile-columns", "priority");
    expect(screen.getByRole("columnheader", { name: "Groep" })).toHaveAttribute("data-mobile-secondary");
    expect(screen.getByText("LED")).toHaveAttribute("data-mobile-secondary");
    expect(screen.getByText("ART-001")).not.toHaveAttribute("data-mobile-secondary");
    expect(screen.getByRole("columnheader", { name: "Artikel" })).not.toHaveAttribute("data-mobile-secondary");
  });

  it("offers a named keyboard-focusable scroll region and a reversible column toggle", async () => {
    const user = userEvent.setup();
    render(<Example mobileLabel="Artikelen" />);
    const region = screen.getByRole("region", { name: "Artikelen, horizontaal schuifbare tabel" });
    expect(region).toHaveAttribute("tabindex", "0");
    const toggle = screen.getByRole("button", { name: "Toon alle kolommen van artikelen" });
    expect(toggle).toHaveAttribute("aria-controls", region.id);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    region.scrollLeft = 180;
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(region.scrollLeft).toBe(0);
    expect(screen.getByRole("table")).toHaveAttribute("data-mobile-columns", "all");
    expect(screen.getByText("Schuif zijwaarts. De eerste kolom blijft zichtbaar.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Toon minder kolommen van artikelen" }));
    expect(screen.getByRole("table")).toHaveAttribute("data-mobile-columns", "priority");
    expect(screen.getByText("ART-001")).toBeInTheDocument();
    expect(within(region).getAllByRole("columnheader")).toHaveLength(2);
  });

  it("keeps row keyboard and click handlers intact", () => {
    const activate = vi.fn();
    render(<Table mobileLabel="Orders"><TableBody><TableRow role="link" tabIndex={0} aria-label="Open bon 123" onClick={activate} onKeyDown={activate}><TableCell>123</TableCell></TableRow></TableBody></Table>);
    const row = screen.getByRole("link", { name: "Open bon 123" });
    fireEvent.keyDown(row, { key: "Enter" });
    fireEvent.keyDown(row, { key: " " });
    fireEvent.click(row);
    expect(activate).toHaveBeenCalledTimes(3);
  });
});
