import { marked } from "marked";

export const ARTICLE_DIRECTORY_PATTERN =
  /^(\d{4}-\d{2}-\d{2})_(\d{6})_([a-z0-9]+(?:-[a-z0-9]+)*)$/;

const assertValidCalendarDate = (value) => {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`Invalid article publication date: ${value}`);
  }
};

export const parseArticleDirectoryName = (directoryName) => {
  const match = ARTICLE_DIRECTORY_PATTERN.exec(directoryName);
  if (!match) {
    throw new Error(`Invalid article directory name: ${directoryName}`);
  }

  const [, publishDate, id, description] = match;
  assertValidCalendarDate(publishDate);

  return {
    directoryName,
    id,
    publishDate,
    description,
  };
};

const inlineText = (tokens = []) =>
  tokens
    .map((token) => {
      if (Array.isArray(token.tokens)) {
        return inlineText(token.tokens);
      }
      if (token.type === "image") {
        return token.text ?? "";
      }
      if (token.type === "br") {
        return " ";
      }
      return typeof token.text === "string" ? token.text : "";
    })
    .join("");

const summaryText = (token) => {
  if (token.type === "paragraph") {
    return inlineText(token.tokens).trim();
  }
  if (token.type === "blockquote") {
    const paragraph = token.tokens?.find((child) => child.type === "paragraph");
    return paragraph ? inlineText(paragraph.tokens).trim() : "";
  }
  return "";
};

const assertSafeLinkHref = (href) => {
  const value = String(href ?? "").trim();
  const scheme = /^([a-z][a-z\d+.-]*):/i.exec(value)?.[1]?.toLowerCase();
  if (scheme && !["http", "https", "mailto", "tel"].includes(scheme)) {
    throw new Error(`Unsupported article link protocol: ${scheme}:`);
  }
};

export const parseArticleMarkdown = ({ markdown }) => {
  const tokens = marked.lexer(markdown);
  let rawHtmlFound = false;

  marked.walkTokens(tokens, (token) => {
    if (token.type === "html") {
      rawHtmlFound = true;
    }
    if (token.type === "link") {
      assertSafeLinkHref(token.href);
    }
  });

  if (rawHtmlFound) {
    throw new Error("Raw HTML is not supported in article Markdown.");
  }

  const titleIndex = tokens.findIndex(
    (token) => token.type === "heading" && token.depth === 1,
  );
  if (titleIndex === -1) {
    throw new Error("Article Markdown requires a level-one title.");
  }

  const titleToken = tokens[titleIndex];
  const name = inlineText(titleToken.tokens).trim();
  if (!name) {
    throw new Error("Article Markdown requires a non-empty level-one title.");
  }

  const summary = tokens
    .slice(titleIndex + 1)
    .map(summaryText)
    .find(Boolean);
  if (!summary) {
    throw new Error("Article Markdown requires a summary after the title.");
  }

  const bodyTokens = tokens.filter((_token, index) => index !== titleIndex);
  return {
    name,
    summary,
    contentHtml: marked.parser(bodyTokens),
  };
};
