import fs from "node:fs";
import path from "node:path";

import { marked } from "marked";

export const ARTICLE_DIRECTORY_PATTERN =
  /^(\d{4}-\d{2}-\d{2})_(\d{6})_([a-z0-9]+(?:-[a-z0-9]+)*)$/;

const OSS_ARTICLE_BASE_URL =
  "https://static.zhangrh.shop/zhangrh-shop/hub/static/articles";

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

export const parseArticleMarkdown = ({ markdown, resolveImage }) => {
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
  marked.walkTokens(bodyTokens, (token) => {
    if (token.type !== "image") {
      return;
    }
    if (typeof resolveImage !== "function") {
      throw new Error(`Article image cannot be resolved: ${token.href}`);
    }
    token.href = resolveImage(token.href);
  });

  return {
    name,
    summary,
    contentHtml: marked.parser(bodyTokens),
  };
};

const isPathInside = ({ parent, candidate }) => {
  const relative = path.relative(parent, candidate);
  return (
    relative !== "" &&
    !relative.startsWith(`..${path.sep}`) &&
    relative !== ".." &&
    !path.isAbsolute(relative)
  );
};

const decodeLocalImageHref = (href) => {
  const value = String(href ?? "").trim();
  if (/^https?:\/\//i.test(value)) {
    if (/prod-files-secure/i.test(value)) {
      throw new Error(`Notion temporary image URL is not allowed: ${value}`);
    }
    throw new Error(`Article images must use a local relative path: ${value}`);
  }
  if (!value || path.isAbsolute(value) || /^[a-z][a-z\d+.-]*:/i.test(value)) {
    throw new Error(`Article images must use a local relative path: ${value}`);
  }

  const pathOnly = value.split(/[?#]/, 1)[0];
  try {
    return decodeURIComponent(pathOnly);
  } catch {
    throw new Error(`Article image path is not valid URL encoding: ${value}`);
  }
};

const resolveArticleImage = ({
  href,
  articleDirectory,
  articleId,
  generatedRoot,
  mode,
}) => {
  const decodedHref = decodeLocalImageHref(href);
  const assetsRoot = path.resolve(articleDirectory, "assets");
  const sourcePath = path.resolve(articleDirectory, decodedHref);

  if (!isPathInside({ parent: assetsRoot, candidate: sourcePath })) {
    throw new Error(
      `Article image must be stored under its assets directory: ${href}`,
    );
  }
  if (!fs.existsSync(sourcePath) || !fs.statSync(sourcePath).isFile()) {
    throw new Error(`Article image does not exist: ${href}`);
  }

  const realAssetsRoot = fs.realpathSync(assetsRoot);
  const realSourcePath = fs.realpathSync(sourcePath);
  if (!isPathInside({ parent: realAssetsRoot, candidate: realSourcePath })) {
    throw new Error(
      `Article image must be stored under its assets directory: ${href}`,
    );
  }

  const relativeAssetPath = path
    .relative(assetsRoot, sourcePath)
    .split(path.sep)
    .join("/");
  const destinationPath = path.join(
    generatedRoot,
    "public",
    "static",
    "articles",
    articleId,
    ...relativeAssetPath.split("/"),
  );
  fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
  fs.copyFileSync(sourcePath, destinationPath);

  const encodedPath = relativeAssetPath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  const relativePublicPath = `${articleId}/${encodedPath}`;
  const publicUrl =
    mode === "production"
      ? `${OSS_ARTICLE_BASE_URL}/${relativePublicPath}`
      : `/static/articles/${relativePublicPath}`;

  return {
    publicUrl,
    relativeAssetPath,
  };
};

const assertSafeGeneratedRoot = ({ articlesRoot, generatedRoot }) => {
  if (path.basename(generatedRoot) !== ".generated") {
    throw new Error("Article generated target must be named .generated.");
  }
  if (
    articlesRoot === generatedRoot ||
    isPathInside({ parent: generatedRoot, candidate: articlesRoot }) ||
    isPathInside({ parent: articlesRoot, candidate: generatedRoot })
  ) {
    throw new Error(
      "Article generated target must not contain or be contained by the article source tree.",
    );
  }
};

const listArticleDirectories = (articlesRoot) => {
  if (!fs.existsSync(articlesRoot)) {
    return [];
  }
  return fs
    .readdirSync(articlesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
};

export const prepareArticles = ({
  articlesRoot,
  generatedRoot,
  mode,
}) => {
  if (mode !== "development" && mode !== "production") {
    throw new Error(`Invalid article preparation mode: ${mode}`);
  }

  const resolvedArticlesRoot = path.resolve(articlesRoot);
  const resolvedGeneratedRoot = path.resolve(generatedRoot);
  assertSafeGeneratedRoot({
    articlesRoot: resolvedArticlesRoot,
    generatedRoot: resolvedGeneratedRoot,
  });

  const parsedDirectories = listArticleDirectories(resolvedArticlesRoot).map(
    (directoryName) => parseArticleDirectoryName(directoryName),
  );
  const seenIds = new Set();
  for (const article of parsedDirectories) {
    if (seenIds.has(article.id)) {
      throw new Error(`Duplicate article id: ${article.id}`);
    }
    seenIds.add(article.id);
  }

  fs.rmSync(resolvedGeneratedRoot, { recursive: true, force: true });
  fs.mkdirSync(resolvedGeneratedRoot, { recursive: true });

  const copiedImages = new Set();
  const articles = parsedDirectories.map((directory) => {
    const articleDirectory = path.join(
      resolvedArticlesRoot,
      directory.directoryName,
    );
    const markdownPath = path.join(articleDirectory, "index.md");
    if (!fs.existsSync(markdownPath) || !fs.statSync(markdownPath).isFile()) {
      throw new Error(`Article index.md does not exist: ${directory.directoryName}`);
    }

    const markdownResult = parseArticleMarkdown({
      markdown: fs.readFileSync(markdownPath, "utf8"),
      resolveImage: (href) => {
        const image = resolveArticleImage({
          href,
          articleDirectory,
          articleId: directory.id,
          generatedRoot: resolvedGeneratedRoot,
          mode,
        });
        copiedImages.add(`${directory.id}/${image.relativeAssetPath}`);
        return image.publicUrl;
      },
    });

    return {
      id: directory.id,
      name: markdownResult.name,
      summary: markdownResult.summary,
      publishDate: directory.publishDate,
      contentHtml: markdownResult.contentHtml,
    };
  });

  articles.sort(
    (left, right) =>
      right.publishDate.localeCompare(left.publishDate) ||
      right.id.localeCompare(left.id),
  );

  const registryPath = path.join(resolvedGeneratedRoot, "articles.json");
  fs.writeFileSync(registryPath, `${JSON.stringify(articles, null, 2)}\n`);

  return {
    articles,
    articleCount: articles.length,
    imageCount: copiedImages.size,
    registryPath,
  };
};
