import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VerkoopFurExportToolbar } from "../verkoop-fur-export-toolbar";
import type { VerkoopFurItem } from "@/lib/api-client";

const mockOutput = vi.fn(() => new Blob(["pdf-bytes"], { type: "application/pdf" }));
const mockSetFont = vi.fn();
const mockSetFontSize = vi.fn();
const mockSetTextColor = vi.fn();
const mockText = vi.fn();
const mockGetTextWidth = vi.fn(() => 10);

vi.mock("jspdf", () => {
  class MockJsPdf {
    setFont = mockSetFont;
    setFontSize = mockSetFontSize;
    setTextColor = mockSetTextColor;
    text = mockText;
    getTextWidth = mockGetTextWidth;
    output = mockOutput;
  }
  return { jsPDF: MockJsPdf };
});

const mockAutoTable = vi.fn();
vi.mock("jspdf-autotable", () => ({
  default: (...args: unknown[]) => mockAutoTable(...args),
}));

const items: VerkoopFurItem[] = [
  {
    klnr: 14644,
    naam: "CONE LIGHTING BV",
    aantalFurOrders: 3,
    totaalAantalStuks: 42,
    laatsteBesteldatum: "2026-07-15",
  },
];

describe("VerkoopFurExportToolbar", () => {
  let createObjectURLSpy: ReturnType<typeof vi.fn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.fn>;
  let clickSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    createObjectURLSpy = vi.fn(() => "blob:mock-url");
    revokeObjectURLSpy = vi.fn();
    URL.createObjectURL = createObjectURLSpy;
    URL.revokeObjectURL = revokeObjectURLSpy;
    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    clickSpy.mockRestore();
  });

  it("renders a PDF and a CSV button", () => {
    render(
      <VerkoopFurExportToolbar items={items} periodeVan="2025-08-20" periodeTot="2026-08-20" />
    );

    expect(screen.getByRole("button", { name: /PDF/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /CSV/ })).toBeInTheDocument();
  });

  it("clicking the PDF button generates a PDF and triggers a download, showing a loading state", async () => {
    const user = userEvent.setup();
    render(
      <VerkoopFurExportToolbar items={items} periodeVan="2025-08-20" periodeTot="2026-08-20" />
    );

    const pdfButton = screen.getByRole("button", { name: /PDF/ });
    await user.click(pdfButton);

    expect(mockAutoTable).toHaveBeenCalledTimes(1);
    expect(mockOutput).toHaveBeenCalledWith("blob");
    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLSpy).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /PDF/ })).not.toBeDisabled();
    });
  });

  it("does not call autoTable when items is empty (empty-state text path instead)", async () => {
    const user = userEvent.setup();
    render(<VerkoopFurExportToolbar items={[]} periodeVan="2025-08-20" periodeTot="2026-08-20" />);

    await user.click(screen.getByRole("button", { name: /PDF/ }));

    expect(mockAutoTable).not.toHaveBeenCalled();
    expect(mockOutput).toHaveBeenCalledWith("blob");
    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
  });

  it("clicking the CSV button triggers a download without a loading state", async () => {
    const user = userEvent.setup();
    render(
      <VerkoopFurExportToolbar items={items} periodeVan="2025-08-20" periodeTot="2026-08-20" />
    );

    const csvButton = screen.getByRole("button", { name: /CSV/ });
    await user.click(csvButton);

    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(csvButton).not.toBeDisabled();
  });
});
