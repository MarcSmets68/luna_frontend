import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BoxArticleRow } from "../box-article-row";
import type { BoxOverzichtArticle } from "../../types";

const article: BoxOverzichtArticle = {
  artnr: "ART-1",
  omschrijving: "Aluminium profiel 2m",
  aantal: 3,
  barcode: "590123456",
};

describe("BoxArticleRow", () => {
  it("renders artnr, omschrijving and aantal", () => {
    render(<BoxArticleRow article={article} onPrint={vi.fn()} />);
    expect(screen.getByText("ART-1")).toBeInTheDocument();
    expect(screen.getByText("Aluminium profiel 2m")).toBeInTheDocument();
    expect(screen.getByText("Aantal: 3")).toBeInTheDocument();
  });

  it("calls onPrint with the row article when Print label is clicked", async () => {
    const user = userEvent.setup();
    const onPrint = vi.fn();
    render(<BoxArticleRow article={article} onPrint={onPrint} />);

    await user.click(screen.getByRole("button", { name: /Print label/ }));

    expect(onPrint).toHaveBeenCalledWith(article);
  });

  it("has a large, thumb-friendly print button (>=44px touch target class)", () => {
    render(<BoxArticleRow article={article} onPrint={vi.fn()} />);
    const button = screen.getByRole("button", { name: /Print label/ });
    expect(button.className).toContain("h-11");
    expect(button.className).toContain("min-w-11");
  });
});
