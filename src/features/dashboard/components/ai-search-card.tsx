"use client";

import { useState, type FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchDashboardAi, type AiSearchResponse } from "@/lib/api-client";
import { AiSearchResultList } from "./ai-search-result-list";

/**
 * Free-text AI search box shown below the existing dashboard cards. Server
 * state (the search result) is fetched only on submit - not on page load -
 * and lives in this component as plain useState (no React Query/SWR in
 * this codebase), same pattern as LoginPage's isSubmitting/serverError.
 */
export function AiSearchCard() {
  const [promptText, setPromptText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<AiSearchResponse | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading || !promptText.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await searchDashboardAi(promptText.trim());
      setResult(response);
    } catch (e) {
      setResult(null);
      setErrorMessage(
        e instanceof Error ? e.message : "Zoeken is mislukt. Probeer het opnieuw."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="mt-4 rounded-none border-border shadow-none">
      <CardHeader className="border-b border-border py-3.5">
        <CardTitle className="text-sm font-semibold text-foreground">AI-zoekopdracht</CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="Stel een vraag, bv. 'toon open offertes van CONE LIGHTING'"
            disabled={isLoading}
            aria-label="AI-zoekopdracht"
          />
          <Button type="submit" disabled={isLoading || !promptText.trim()}>
            {isLoading ? "Bezig met zoeken..." : "Zoeken"}
          </Button>
        </form>

        {errorMessage && (
          <p role="alert" className="mt-3 text-[13px] text-destructive">
            {errorMessage}
          </p>
        )}

        {result?.resultType === "clarification" && (
          <p className="mt-3 text-[13px] text-muted-foreground">{result.clarificationQuestion}</p>
        )}

        {result?.resultType === "no_results" && (
          <p className="mt-3 text-[13px] text-muted-foreground">{result.summary}</p>
        )}

        {result?.resultType === "results" && (
          <div className="mt-3">
            {result.summary && (
              <p className="mb-2 text-[13px] text-[#444444]">{result.summary}</p>
            )}
            <AiSearchResultList items={result.items} />
            {result.hasMore && (
              <p className="mt-2 text-[12px] text-muted-foreground">
                Er zijn meer resultaten dan getoond — verfijn je zoekopdracht
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
