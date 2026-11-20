import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { maakLakorderFixtures } from "../../lakorder-fixtures";
import { brusselseDag, maakLakordersWerklijsten } from "../../lakorder-werklijst";
import { LakorderWerklijst } from "../lakorder-werklijst";

const vandaag = "2026-11-20";

function renderProef() {
  render(<LakorderWerklijst werklijsten={maakLakordersWerklijsten(maakLakorderFixtures(vandaag), vandaag)} />);
}

function zichtbareArtikels() {
  return within(screen.getByRole("tabpanel"))
    .getAllByRole("row").slice(1)
    .map((row) => within(row).getByText(/^DEMO-LAK-/).textContent);
}

describe("Lakorders werklijst", () => {
  it("sorts by deadline, then source reference, with unknown deadlines last", () => {
    renderProef();
    expect(zichtbareArtikels()).toEqual(["DEMO-LAK-01", "DEMO-LAK-02", "DEMO-LAK-04", "DEMO-LAK-03"]);
    const onbekend = within(screen.getByRole("row", { name: /DEMO-LAK-03/ })).getAllByRole("cell");
    expect(onbekend[4]).toHaveTextContent("Onbekend");
    expect(onbekend[5]).toHaveTextContent("Onbekend");
    expect(screen.getByText("1002 / 10 / 1")).toBeVisible();
    expect(screen.queryByText("1002 / 10")).not.toBeInTheDocument();
  });

  it("combines all filters without hiding options when there is no match", async () => {
    const user = userEvent.setup();
    renderProef();

    async function kies(filter: string, waarde: string) {
      await user.click(screen.getByRole("combobox", { name: filter }));
      await user.click(await screen.findByRole("option", { name: waarde }));
    }

    await kies("Leverancier", "Voorbeeld Lak");
    await kies("Kleur / techniek / afwerking", "Poederlak · RAL 9005 · Mat");
    await kies("Bronsoort", "Order");
    await kies("Opvolgstatus", "Deels gereserveerd");
    expect(zichtbareArtikels()).toEqual(["DEMO-LAK-04"]);

    await kies("Leverancier", "Voorbeeld Ano");
    expect(screen.getByText("Geen regels voor de gekozen filters.")).toBeVisible();

    await user.click(screen.getByRole("tab", { name: "Besteld, op te volgen" }));
    expect(zichtbareArtikels()).toEqual(["DEMO-LAK-05", "DEMO-LAK-06", "DEMO-LAK-07", "DEMO-LAK-08"]);
    await kies("Opvolgstatus", "Levering te laat");
    expect(zichtbareArtikels()).toEqual(["DEMO-LAK-05"]);

    await user.click(screen.getByRole("tab", { name: "Te bestellen" }));
    expect(screen.getByText("Geen regels voor de gekozen filters.")).toBeVisible();
  });

  it("separates order date from delivery and shows only evidenced external progress", async () => {
    const user = userEvent.setup();
    renderProef();
    await user.click(screen.getByRole("tab", { name: "Besteld, op te volgen" }));
    const rij = (code: string) => within(screen.getByRole("row", { name: new RegExp(code) }));

    expect(rij("DEMO-LAK-05").getByText("Levering te laat")).toBeVisible();
    expect(rij("DEMO-LAK-05").getByText("Bij de lakkerij")).toBeVisible();
    expect(rij("DEMO-LAK-06").getByText("Ontvangst onbekend")).toBeVisible();
    expect(rij("DEMO-LAK-07").getByText("Levering bevestigd")).toBeVisible();
    const cellen = rij("DEMO-LAK-08").getAllByRole("cell");
    expect(cellen[5]).toHaveTextContent("12/11/2026");
    expect(cellen[6]).toHaveTextContent("Niet bevestigd");
    expect(cellen[7]).toHaveTextContent("Onbekend");
    expect(cellen[8]).toHaveTextContent("Niet bevestigd");
    expect(screen.queryByRole("row", { name: /DEMO-LAK-09/ })).not.toBeInTheDocument();
  });

  it("normalizes an impossible date without replacing a known zero", () => {
    const bron = maakLakorderFixtures(vandaag);
    const regel = bron.besteld.teLaat;
    const { besteld } = maakLakordersWerklijsten({
      ...bron,
      besteld: { ongeldigeDatum: { ...regel, beloofdeLeverdatum: "2026-02-30", openSaldo: 0 } },
    }, vandaag);
    expect(besteld[0]).toMatchObject({
      beloofdeLeverdatum: null,
      bestellingsdatum: "2026-11-12",
      openSaldo: 0,
      status: "Niet bevestigd",
    });
  });

  it("uses the calendar day in Brussels, including the daylight-saving offset", () => {
    expect(brusselseDag(new Date("2026-07-19T22:30:00Z"))).toBe("2026-07-20");
    expect(brusselseDag(new Date("2026-11-19T22:30:00Z"))).toBe("2026-11-19");
  });
});
