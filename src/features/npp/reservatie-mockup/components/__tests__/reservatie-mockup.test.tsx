import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReservatieMockup } from "../reservatie-mockup";

describe("ReservatieMockup", () => {
  it("shows the reservatielijst with mock lijnen", () => {
    render(<ReservatieMockup />);
    expect(screen.getByText(/Reservatie van onderdelen \(mockup\)/)).toBeInTheDocument();
    expect(screen.getByText(/Bon 24512/)).toBeInTheDocument();
  });

  it("opens a lijn, scans parts correctly and confirms the amount", () => {
    render(<ReservatieMockup />);
    const row = screen.getByText(/Bon 24512/).closest("li")!;
    fireEvent.click(within(row).getByRole("button", { name: "Openen" }));

    expect(screen.getAllByText(/ART-DRV-24W/).length).toBeGreaterThan(0);
    fireEvent.click(
      screen.getByRole("button", { name: "Simuleer scan: juist onderdeel" }),
    );
    expect(screen.getByTestId("aantal-waarde")).toHaveTextContent("12");
    fireEvent.click(screen.getByRole("button", { name: "Bevestigen" }));

    expect(
      screen.getByText(/l1-o1 bevestigd|ART-DRV-24W: 12 bevestigd/),
    ).toBeTruthy();
  });

  it("blocks 'Naar productielijst' while a part waits on material, and unblocks after it arrives and is scanned", () => {
    render(<ReservatieMockup />);
    const row = screen.getByText(/Bon 24512/).closest("li")!;
    fireEvent.click(within(row).getByRole("button", { name: "Openen" }));

    // l1-o1 has enough stock - confirm it so the active part becomes l1-o2.
    fireEvent.click(
      screen.getByRole("button", { name: "Simuleer scan: juist onderdeel" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Bevestigen" }));

    // l1-o2 is short on stock - confirm triggers the shortage dialog.
    fireEvent.click(
      screen.getByRole("button", { name: "Simuleer scan: juist onderdeel" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Bevestigen" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Nee, niet aanwezig" }),
    );

    // Non-postponable shortage -> the line is blocked from production.
    expect(
      screen.getByText(/Niet mogelijk: lijn wacht op materiaal/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Naar productielijst" }),
    ).toBeDisabled();

    // Simulate the delivery arriving, then scan and confirm the part normally.
    fireEvent.click(
      screen.getByRole("button", { name: "Materiaal ontvangen (simuleer)" }),
    );
    expect(
      screen.queryByText(/Niet mogelijk: lijn wacht op materiaal/),
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Simuleer scan: juist onderdeel" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Bevestigen" }));

    expect(screen.getAllByText(/ART-LED-1500-40/).length).toBeGreaterThan(0);
  });

  it("notifies the supervisor after 3 wrong scans", () => {
    render(<ReservatieMockup />);
    const row = screen.getByText(/Bon 24512/).closest("li")!;
    fireEvent.click(within(row).getByRole("button", { name: "Openen" }));

    const foutButton = screen.getByRole("button", {
      name: "Simuleer scan: fout onderdeel (ander vermogen)",
    });
    fireEvent.click(foutButton);
    fireEvent.click(foutButton);
    fireEvent.click(foutButton);

    expect(screen.getByRole("alert")).toHaveTextContent(/Leidinggevende verwittigd/);
  });
});
