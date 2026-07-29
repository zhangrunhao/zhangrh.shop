import type { Article } from "../types";

const generatedArticleModules = import.meta.glob(
  "../.generated/articles.json",
  {
    eager: true,
    import: "default",
  },
);

const generatedArticles = Object.values(generatedArticleModules)[0] ?? [];

const isArticle = (value: unknown): value is Article => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const article = value as Record<string, unknown>;
  return (
    typeof article.id === "string" &&
    /^\d{6}$/.test(article.id) &&
    typeof article.name === "string" &&
    typeof article.summary === "string" &&
    typeof article.publishDate === "string" &&
    typeof article.contentHtml === "string"
  );
};

if (!Array.isArray(generatedArticles) || !generatedArticles.every(isArticle)) {
  throw new Error("Generated article registry is invalid.");
}

export const ARTICLES: Article[] = [...generatedArticles].sort(
  (left, right) =>
    right.publishDate.localeCompare(left.publishDate) ||
    right.id.localeCompare(left.id),
);
