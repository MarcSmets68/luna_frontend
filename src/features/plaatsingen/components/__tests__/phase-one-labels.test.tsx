import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { NppMenu } from "@/features/npp/components/npp-menu";
import { PlaatsingenDemoNotice } from "../plaatsingen-demo-notice";

describe("phase one availability labels", () => {
  it("explains that placements are read-only example data, not backend records", () => {
    render(<PlaatsingenDemoNotice />);
    const note = screen.getByRole("note");
    expect(within(note).getByText("Demo — voorbeeldgegevens")).toBeInTheDocument();
    expect(note).toHaveTextContent("nog niet gekoppeld aan de backend");
    expect(note).toHaveTextContent("alleen bekijken");
  });

  it("disables and labels unavailable NPP actions without disabling real routes", async () => {
    const user = userEvent.setup();
    render(<NppMenu />);
    expect(screen.getByRole("button", { name: "Productie starten / afsluiten — Nog niet beschikbaar" })).toBeDisabled();
    expect(screen.getByRole("link", { name: "Scannen / verifiëren" })).toHaveAttribute("href", "/npp/scannen");
    await user.click(screen.getByRole("tab", { name: "Sikta" }));
    expect(screen.getByRole("button", { name: "Sikta-assemblage — Nog niet beschikbaar" })).toBeDisabled();
    expect(screen.getAllByText("Nog niet beschikbaar")).toHaveLength(2);
  });
});
