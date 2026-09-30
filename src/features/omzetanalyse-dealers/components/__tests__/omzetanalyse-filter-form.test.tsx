import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  OmzetanalyseFilterForm,
  buildReportUrl,
  type OmzetanalyseFilterValues,
} from "../omzetanalyse-filter-form";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("../../lib/actions", () => ({ zoekKlantenAction: vi.fn().mockResolvedValue([]) }));

const soorten = [
  { kode: "LS", omschr: "Ledstrips" },
  { kode: "PR", omschr: "Profielen" },
];
const empty: OmzetanalyseFilterValues = {
  datumVan: "",
  datumTot: "",
  klnr: null,
  klantNaam: null,
  soort: "",
  perDealer: false,
};

describe("buildReportUrl", () => {
  it("omits empty params and always adds uitvoeren", () => {
    expect(buildReportUrl(empty)).toBe("/rapportage/omzetanalyse-dealers?uitvoeren=1");
  });

  it("includes set params; perDealer only with soort", () => {
    expect(
      buildReportUrl({ ...empty, datumVan: "2026-01-01", klnr: 5, soort: "LS", perDealer: true })
    ).toBe(
      "/rapportage/omzetanalyse-dealers?datumVan=2026-01-01&klnr=5&soort=LS&perDealer=true&uitvoeren=1"
    );
    expect(buildReportUrl({ ...empty, perDealer: true })).not.toContain("perDealer");
  });
});

describe("OmzetanalyseFilterForm", () => {
  beforeEach(() => push.mockReset());

  it("disables the per-dealer toggle without a soort", () => {
    render(<OmzetanalyseFilterForm soorten={soorten} initial={empty} />);
    expect(screen.getByRole("checkbox", { name: /per dealer/ })).toHaveAttribute("aria-disabled", "true");
  });

  it("enables the toggle with an initial soort and clears it when soort is reset", async () => {
    const user = userEvent.setup();
    render(
      <OmzetanalyseFilterForm soorten={soorten} initial={{ ...empty, soort: "LS", perDealer: true }} />
    );
    const toggle = screen.getByRole("checkbox", { name: /per dealer/ });
    expect(toggle).not.toHaveAttribute("aria-disabled", "true");
    expect(toggle).toHaveAttribute("aria-checked", "true");

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "Alle soorten" }));

    expect(screen.getByRole("checkbox", { name: /per dealer/ })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("checkbox", { name: /per dealer/ })).toHaveAttribute("aria-checked", "false");
  });

  it("blocks submit when datum van is after datum tot", async () => {
    const user = userEvent.setup();
    render(
      <OmzetanalyseFilterForm
        soorten={soorten}
        initial={{ ...empty, datumVan: "2026-05-01", datumTot: "2026-01-01" }}
      />
    );
    await user.click(screen.getByRole("button", { name: "Toon rapport" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Datum van mag niet na datum tot liggen");
    expect(push).not.toHaveBeenCalled();
  });

  it("submits the expected URL", async () => {
    const user = userEvent.setup();
    render(
      <OmzetanalyseFilterForm
        soorten={soorten}
        initial={{ ...empty, datumVan: "2026-01-01", datumTot: "2026-03-31" }}
      />
    );
    await user.click(screen.getByRole("button", { name: "Toon rapport" }));
    expect(push).toHaveBeenCalledWith(
      "/rapportage/omzetanalyse-dealers?datumVan=2026-01-01&datumTot=2026-03-31&uitvoeren=1"
    );
  });
});
