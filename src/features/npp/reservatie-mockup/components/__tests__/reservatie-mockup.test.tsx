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
