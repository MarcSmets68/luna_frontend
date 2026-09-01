import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AiSearchCard } from "../ai-search-card";
import type { AiSearchResponse } from "@/lib/api-client";

const searchDashboardAiMock = vi.fn();
vi.mock("@/lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-client")>("@/lib/api-client");
  return {
    ...actual,
    searchDashboardAi: (...args: unknown[]) => searchDashboardAiMock(...args),
  };
});

const baseResponse: Omit<AiSearchResponse, "resultType"> = {
  queryText: "open offertes CONE LIGHTING",
  entity: "offerte",
  intent: {
    entity: "offerte",
    filters: [{ field: "naam", operator: "contains", value: "CONE LIGHTING" }],
    aggregation: null,
    confidence: 0.9,
  },
  items: [],
  page: 1,
  pageSize: 25,
  hasMore: false,
  summary: null,
  clarificationQuestion: null,
};

beforeEach(() => {
  searchDashboardAiMock.mockReset();
});

describe("AiSearchCard", () => {
  it("renders the idle state with an input and submit button", () => {
    render(<AiSearchCard />);
    expect(screen.getByRole("textbox", { name: "AI-zoekopdracht" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Zoeken" })).toBeInTheDocument();
  });

  it("keeps the submit button disabled for empty/whitespace-only input and never calls the API", async () => {
    const user = userEvent.setup();
    render(<AiSearchCard />);
    const submitButton = screen.getByRole("button", { name: "Zoeken" });
    const textbox = screen.getByRole("textbox", { name: "AI-zoekopdracht" });

    expect(submitButton).toBeDisabled();

    await user.type(textbox, "   ");
    expect(submitButton).toBeDisabled();

    // Clicking a disabled button is a no-op in the DOM, but also guard the
    // handler itself in case the disabled attribute is ever dropped.
    await user.click(submitButton);
    expect(searchDashboardAiMock).not.toHaveBeenCalled();
  });

  it("ignores a second rapid submit while the first request is still pending", async () => {
    let resolveSearch: (value: AiSearchResponse) => void = () => {};
    searchDashboardAiMock.mockImplementation(
      () =>
        new Promise<AiSearchResponse>((resolve) => {
          resolveSearch = resolve;
        })
    );

    const user = userEvent.setup();
    render(<AiSearchCard />);
    await user.type(screen.getByRole("textbox", { name: "AI-zoekopdracht" }), "open offertes");

    const submitButton = screen.getByRole("button", { name: "Zoeken" });
    await user.click(submitButton);
    // Button is now disabled/relabeled, but fire the submit event again to
    // confirm the handler's own isLoading guard also blocks a re-entrant call.
    const form = screen.getByRole("textbox", { name: "AI-zoekopdracht" }).closest("form")!;
    form.requestSubmit();

    expect(searchDashboardAiMock).toHaveBeenCalledTimes(1);

    resolveSearch({ ...baseResponse, resultType: "no_results", summary: "Geen resultaten." });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Zoeken" })).not.toBeDisabled()
    );
  });

  it("shows the loading state while the request is pending and does not fetch on page load", async () => {
    expect(searchDashboardAiMock).not.toHaveBeenCalled();

    let resolveSearch: (value: AiSearchResponse) => void = () => {};
    searchDashboardAiMock.mockImplementation(
      () =>
        new Promise<AiSearchResponse>((resolve) => {
          resolveSearch = resolve;
        })
    );

    const user = userEvent.setup();
    render(<AiSearchCard />);
    await user.type(screen.getByRole("textbox", { name: "AI-zoekopdracht" }), "open offertes");
    await user.click(screen.getByRole("button", { name: "Zoeken" }));

    expect(await screen.findByRole("button", { name: "Bezig met zoeken..." })).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "AI-zoekopdracht" })).toBeDisabled();

    resolveSearch({ ...baseResponse, resultType: "no_results", summary: "Geen resultaten." });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Zoeken" })).not.toBeDisabled()
    );
  });

  it("renders a results table and the summary text on a successful results response", async () => {
    searchDashboardAiMock.mockResolvedValue({
      ...baseResponse,
      resultType: "results",
      summary: "2 offertes gevonden.",
      items: [
        { offnr: 2167769, naam: "CONE LIGHTING BV", bedrag: 4820 },
        { offnr: 2167770, naam: "CONE LIGHTING BV", bedrag: 1200 },
      ],
    });

    const user = userEvent.setup();
    render(<AiSearchCard />);
    await user.type(screen.getByRole("textbox", { name: "AI-zoekopdracht" }), "open offertes CONE LIGHTING");
    await user.click(screen.getByRole("button", { name: "Zoeken" }));

    expect(await screen.findByText("2 offertes gevonden.")).toBeInTheDocument();
    expect(screen.getByText("2167769")).toBeInTheDocument();
    expect(screen.getByText("2167770")).toBeInTheDocument();
    expect(searchDashboardAiMock).toHaveBeenCalledWith("open offertes CONE LIGHTING");
  });

  it("shows the hasMore hint when the backend reports more results than shown", async () => {
    searchDashboardAiMock.mockResolvedValue({
      ...baseResponse,
      resultType: "results",
      summary: "Meer dan 25 offertes gevonden.",
      items: [{ offnr: 1, naam: "Klant A" }],
      hasMore: true,
    });

    const user = userEvent.setup();
    render(<AiSearchCard />);
    await user.type(screen.getByRole("textbox", { name: "AI-zoekopdracht" }), "alle offertes");
    await user.click(screen.getByRole("button", { name: "Zoeken" }));

    expect(
      await screen.findByText("Er zijn meer resultaten dan getoond — verfijn je zoekopdracht")
    ).toBeInTheDocument();
  });

  it("shows the clarification question and no table when resultType is clarification", async () => {
    searchDashboardAiMock.mockResolvedValue({
      ...baseResponse,
      resultType: "clarification",
      clarificationQuestion: "Bedoel je offertes of orders?",
    });

    const user = userEvent.setup();
    render(<AiSearchCard />);
    await user.type(screen.getByRole("textbox", { name: "AI-zoekopdracht" }), "toon me alles");
    await user.click(screen.getByRole("button", { name: "Zoeken" }));

    expect(await screen.findByText("Bedoel je offertes of orders?")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("shows the summary text and no table when resultType is no_results", async () => {
    searchDashboardAiMock.mockResolvedValue({
      ...baseResponse,
      resultType: "no_results",
      summary: "Geen resultaten gevonden voor deze zoekopdracht.",
    });

    const user = userEvent.setup();
    render(<AiSearchCard />);
    await user.type(screen.getByRole("textbox", { name: "AI-zoekopdracht" }), "iets wat niet bestaat");
    await user.click(screen.getByRole("button", { name: "Zoeken" }));

    expect(
      await screen.findByText("Geen resultaten gevonden voor deze zoekopdracht.")
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("shows the backend error message and not a raw stack trace on failure", async () => {
    searchDashboardAiMock.mockRejectedValue(new Error("AI-zoekdienst is tijdelijk niet beschikbaar"));

    const user = userEvent.setup();
    render(<AiSearchCard />);
    await user.type(screen.getByRole("textbox", { name: "AI-zoekopdracht" }), "open offertes");
    await user.click(screen.getByRole("button", { name: "Zoeken" }));

    expect(
      await screen.findByText("AI-zoekdienst is tijdelijk niet beschikbaar")
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
