import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BoxArticleList } from "../box-article-list";
import type { BoxOverzichtArticle } from "../../types";

const articles: BoxOverzichtArticle[] = [
  { artnr: "ART-1", omschrijving: "Profiel A", aantal: 2, barcode: "111" },
  { artnr: "ART-2", omschrijving: "Profiel B", aantal: 5, barcode: "" },
];

describe("BoxArticleList", () => {
  it("renders one row per article", () => {
    render(<BoxArticleList articles={articles} onPrint={vi.fn()} />);
    expect(screen.getByText("ART-1")).toBeInTheDocument();
    expect(screen.getByText("ART-2")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Print label/ })).toHaveLength(2);
  });

  it("renders nothing when the list is empty", () => {
    render(<BoxArticleList articles={[]} onPrint={vi.fn()} />);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });
});
