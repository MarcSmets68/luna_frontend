import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BoxLabelPrintView } from "../box-label-print-view";
import type { BoxOverzichtArticle } from "../../types";

const jsBarcodeMock = vi.fn();
vi.mock("jsbarcode", () => ({ default: (...args: unknown[]) => jsBarcodeMock(...args) }));

const article: BoxOverzichtArticle = {
  artnr: "ART-1",
  omschrijving: "Aluminium profiel 2m",
  aantal: 3,
  barcode: "590123456",
};

describe("BoxLabelPrintView", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    jsBarcodeMock.mockClear();
  });

  it("renders nothing when there is no article to print", () => {
    const { container } = render(<BoxLabelPrintView article={null} onPrinted={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("draws the barcode and triggers window.print() for an article with a barcode", () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});
    render(<BoxLabelPrintView article={article} onPrinted={vi.fn()} />);

    expect(jsBarcodeMock).toHaveBeenCalledWith(
      expect.anything(),
      "590123456",
      expect.objectContaining({ format: "CODE128" })
    );
    expect(printSpy).toHaveBeenCalledTimes(1);
  });

  it("omits the barcode graphic when barcode is empty, but still prints", () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});
    const { container } = render(
      <BoxLabelPrintView article={{ ...article, barcode: "" }} onPrinted={vi.fn()} />
    );

    expect(jsBarcodeMock).not.toHaveBeenCalled();
    expect(container.querySelector("svg")).toBeNull();
    expect(printSpy).toHaveBeenCalledTimes(1);
  });

  it("calls onPrinted when the browsers afterprint event fires", () => {
    vi.spyOn(window, "print").mockImplementation(() => {});
    const onPrinted = vi.fn();
    render(<BoxLabelPrintView article={article} onPrinted={onPrinted} />);

    window.dispatchEvent(new Event("afterprint"));

    expect(onPrinted).toHaveBeenCalledTimes(1);
  });
});
