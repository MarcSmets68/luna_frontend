import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  it("prefills the batch/bin field for a driver, lets the operator edit it, and logs it on confirm", () => {
    render(<ReservatieMockup />);
    const row = screen.getByText(/Bon 24512/).closest("li")!;
    fireEvent.click(within(row).getByRole("button", { name: "Openen" }));

    fireEvent.click(
      screen.getByRole("button", { name: "Simuleer scan: juist onderdeel" }),
    );
    const batchInput = screen.getByLabelText("Batch / bin") as HTMLInputElement;
    expect(batchInput.value).toBe("DRV-2026-11");

    fireEvent.change(batchInput, { target: { value: "BIN-77" } });
    fireEvent.click(screen.getByRole("button", { name: "Bevestigen" }));

    expect(screen.getAllByText("BIN-77").length).toBeGreaterThan(0);
    expect(
      screen.getByText(/batch\/bin: BIN-77/),
    ).toBeInTheDocument();
  });

  it("marks a postponable shortage as 'Open' and does not block 'Naar productielijst'", async () => {
    const user = userEvent.setup();
    render(<ReservatieMockup />);
    const row = screen.getByText(/Bon 24512/).closest("li")!;
    fireEvent.click(within(row).getByRole("button", { name: "Openen" }));

    // l1-o1: enough stock, confirm normally.
    fireEvent.click(
      screen.getByRole("button", { name: "Simuleer scan: juist onderdeel" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Bevestigen" }));

    // l1-o2: shortage, present -> count-and-correct.
    fireEvent.click(
      screen.getByRole("button", { name: "Simuleer scan: juist onderdeel" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Bevestigen" }));
    fireEvent.click(screen.getByRole("button", { name: "Ja, fysiek aanwezig" }));
    fireEvent.change(screen.getByLabelText("Werkelijk geteld aantal"), {
      target: { value: "12" },
    });
    await user.click(screen.getByRole("combobox", { name: "Reden" }));
    await user.click(screen.getByRole("option", { name: "Verkeerde locatie" }));
    fireEvent.click(screen.getByRole("button", { name: "Opslaan" }));
    fireEvent.click(screen.getByRole("button", { name: "Bevestigen" }));

    // l1-o3: enough stock, confirm normally.
    fireEvent.click(
      screen.getByRole("button", { name: "Simuleer scan: juist onderdeel" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Bevestigen" }));

    // l1-o4: postponable shortage, not physically present -> "Open".
    fireEvent.click(
      screen.getByRole("button", { name: "Simuleer scan: juist onderdeel" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Bevestigen" }));
    fireEvent.click(screen.getByRole("button", { name: "Nee, niet aanwezig" }));

    // "Open" does not block the line, unlike "wacht op materiaal".
    expect(
      screen.queryByText(/Niet mogelijk: lijn wacht op materiaal/),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Naar productielijst" }),
    ).not.toBeDisabled();
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
