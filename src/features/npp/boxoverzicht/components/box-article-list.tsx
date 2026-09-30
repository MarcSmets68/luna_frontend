import type { BoxOverzichtArticle } from "../types";
import { BoxArticleRow } from "./box-article-row";

/**
 * Rendered when result.empty === false - one BoxArticleRow per article.
 */
export function BoxArticleList({
  articles,
  onPrint,
}: {
  articles: BoxOverzichtArticle[];
  onPrint: (article: BoxOverzichtArticle) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {articles.map((article) => (
        <BoxArticleRow key={article.artnr} article={article} onPrint={onPrint} />
      ))}
    </div>
  );
}
