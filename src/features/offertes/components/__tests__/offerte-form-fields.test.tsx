import { describe, expect, it } from "vitest";
import {
  EMPTY_OFFERTE_FORM,
  buildOffertePayload,
  offerteToFormValues,
} from "../offerte-form-fields";
import type { OfferteItem } from "@/lib/api-client";

const OFFERTE: OfferteItem = {
  offnr: 2167769,
  versie: 1,
  datum: "2026-08-07",
  klnr: 14644,
  naam: "CONE LIGHTING BV",
  adres: "CATERSHOFLAAN 70-76",
  postnr: "2170",
  stad: "MERKSEM (ANTWERPEN)",
  munt: "EUR",
  bedrag: 624.49,
  btw: 108.38,
  offgroep: "",
  soort: "DNOM",
  passief: false,
  verloren: false,
  verkocht: false,
  verkoopkans: 0,
  uRef: "Test",
  besteldatum: null,
  verkochtdatum: null,
  opm: "",
};

describe("offerteToFormValues", () => {
  it("maps an offerte onto editable form values", () => {
    const form = offerteToFormValues(OFFERTE);
    expect(form).toEqual({
      naam: "CONE LIGHTING BV",
      klnr: "14644",
      adres: "CATERSHOFLAAN 70-76",
      postnr: "2170",
      stad: "MERKSEM (ANTWERPEN)",
      munt: "EUR",
      offgroep: "",
      soort: "DNOM",
      datum: "2026-08-07",
      verkoopkans: "0",
      uRef: "Test",
      opm: "",
      passief: false,
    });
  });

  it("renders an empty datum when the offerte has none", () => {
    const form = offerteToFormValues({ ...OFFERTE, datum: null });
    expect(form.datum).toBe("");
  });
});

describe("buildOffertePayload", () => {
  it("rejects a missing klnr", () => {
    const result = buildOffertePayload(EMPTY_OFFERTE_FORM);
    expect(result.errors?.klnr).toBe("Klnr moet een geldig positief getal zijn.");
    expect(result.payload).toBeUndefined();
  });

  it("rejects a non-positive klnr", () => {
    const result = buildOffertePayload({ ...EMPTY_OFFERTE_FORM, klnr: "-1" });
    expect(result.errors?.klnr).toBeDefined();
  });

  it("rejects a non-numeric verkoopkans", () => {
    const result = buildOffertePayload({
      ...EMPTY_OFFERTE_FORM,
      klnr: "100",
      verkoopkans: "abc",
    });
    expect(result.errors?.verkoopkans).toBe("Verkoopkans moet een geldig getal zijn.");
  });

  it("builds a valid payload with numeric klnr/verkoopkans", () => {
    const result = buildOffertePayload({
      ...EMPTY_OFFERTE_FORM,
      naam: "Test offerte",
      klnr: "100",
      verkoopkans: "50",
      datum: "2026-01-01",
    });
    expect(result.errors).toBeUndefined();
    expect(result.payload).toEqual({
      naam: "Test offerte",
      klnr: 100,
      adres: "",
      postnr: "",
      stad: "",
      munt: "",
      offgroep: "",
      soort: "",
      datum: "2026-01-01",
      verkoopkans: 50,
      uRef: "",
      opm: "",
      passief: false,
    });
  });

  it("defaults an empty verkoopkans to 0", () => {
    const result = buildOffertePayload({ ...EMPTY_OFFERTE_FORM, klnr: "100" });
    expect(result.payload?.verkoopkans).toBe(0);
  });

  it("sends datum as null when left empty", () => {
    const result = buildOffertePayload({ ...EMPTY_OFFERTE_FORM, klnr: "100" });
    expect(result.payload?.datum).toBeNull();
  });
});
