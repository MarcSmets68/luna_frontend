import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OmzetanalyseExportToolbar } from "../omzetanalyse-export-toolbar";
import { jarenResponse } from "../../test-utils/fixtures";

const mockOutput = vi.fn(() => new Blob(["pdf"], { type: "application/pdf" }));
const mockAddPage = vi.fn();
const mockText = vi.fn();

vi.mock("jspdf", () => {
  class MockJsPdf {
    setFont = vi.fn();
    setFontSize = vi.fn();
    setTextColor = vi.fn();
    text = mockText;
    getTextWidth = vi.fn(() => 10);
    addPage = mockAddPage;
    output = mockOutput;
  }
  return { jsPDF: MockJsPdf };
});

const mockAutoTable = vi.fn();
vi.mock("jspdf-autotable", () => ({
  default: (...args: unknown[]) => mockAutoTable(...args),
}));

describe("OmzetanalyseExportToolbar", () => {
  let createObjectURLSpy: ReturnType<typeof vi.fn>;
  let clickSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    createObjectURLSpy = vi.fn(() => "blob:mock");
    URL.createObjectURL = createObjectURLSpy as unknown as typeof URL.createObjectURL;
    URL.revokeObjectURL = vi.fn();
    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    clickSpy.mockRestore();
  });

  it("renders PDF and CSV buttons", () => {
    render(<OmzetanalyseExportToolbar response={jarenResponse} />);
    expect(screen.getByRole("button", { name: /PDF/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /CSV/ })).toBeInTheDocument();
  });

  it("PDF click generates a PDF, downloads it and resets the loading state", async () => {
    const user = userEvent.setup();
    render(<OmzetanalyseExportToolbar response={jarenResponse} />);
    await user.click(screen.getByRole("button", { name: /PDF/ }));

    await waitFor(() => expect(mockOutput).toHaveBeenCalledWith("blob"));
    expect(mockAutoTable).toHaveBeenCalled();
    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.getByRole("button", { name: /PDF/ })).not.toBeDisabled());
  });

  it("adds a new page per dealer section", async () => {
    const user = userEvent.setup();
    const s = jarenResponse.secties[0];
    const res = {
      ...jarenResponse,
      secties: [
        { ...s, dealerKlnr: 1, dealerNaam: "A" },
        { ...s, dealerKlnr: 2, dealerNaam: "B" },
      ],
    };
    render(<OmzetanalyseExportToolbar response={res} />);
    await user.click(screen.getByRole("button", { name: /PDF/ }));
    await waitFor(() => expect(mockOutput).toHaveBeenCalled());
    expect(mockAddPage).toHaveBeenCalledTimes(1);
  });

  it("CSV click downloads without loading state", async () => {
    const user = userEvent.setup();
    render(<OmzetanalyseExportToolbar response={jarenResponse} />);
    await user.click(screen.getByRole("button", { name: /CSV/ }));
    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });
});
