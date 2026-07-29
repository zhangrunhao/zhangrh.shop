import assert from "node:assert/strict";
import test from "node:test";

import {
  parseArticleDirectoryName,
  parseArticleMarkdown,
} from "./article-content-lib.mjs";

test("parseArticleDirectoryName extracts date, id, and description", () => {
  assert.deepEqual(
    parseArticleDirectoryName("2026-07-26_100001_codex-subagent"),
    {
      directoryName: "2026-07-26_100001_codex-subagent",
      id: "100001",
      publishDate: "2026-07-26",
      description: "codex-subagent",
    },
  );
});

test("parseArticleDirectoryName rejects invalid names", () => {
  const invalidNames = [
    "2026-07-26-100001-codex-subagent",
    "2026-02-30_100001_codex-subagent",
    "2026-07-26_10001_codex-subagent",
    "2026-07-26_1000001_codex-subagent",
    "2026-07-26_100001_Codex-subagent",
    "2026-07-26_100001_codex subagent",
    "2026-07-26_100001_codex_subagent",
    "2026-07-26_100001_-codex",
    "2026-07-26_100001_codex-",
  ];

  for (const directoryName of invalidNames) {
    assert.throws(
      () => parseArticleDirectoryName(directoryName),
      /Invalid article directory name|Invalid article publication date/,
      directoryName,
    );
  }
});

test("parseArticleMarkdown derives title and paragraph summary", () => {
  const result = parseArticleMarkdown({
    markdown: [
      "# Codex Subagent：如何隔离上下文",
      "",
      "这是一段包含 **重点** 的摘要。",
      "",
      "## 正文",
      "",
      "正文内容。",
    ].join("\n"),
  });

  assert.equal(result.name, "Codex Subagent：如何隔离上下文");
  assert.equal(result.summary, "这是一段包含 重点 的摘要。");
  assert.doesNotMatch(result.contentHtml, /<h1/);
  assert.match(result.contentHtml, /<p>这是一段包含 <strong>重点<\/strong> 的摘要。<\/p>/);
  assert.match(result.contentHtml, /<h2>正文<\/h2>/);
});

test("parseArticleMarkdown derives summary from a blockquote", () => {
  const result = parseArticleMarkdown({
    markdown: [
      "# 标题",
      "",
      "> Subagent：管理上下文的一种方法",
      "",
      "正文。",
    ].join("\n"),
  });

  assert.equal(result.name, "标题");
  assert.equal(result.summary, "Subagent：管理上下文的一种方法");
  assert.match(result.contentHtml, /<blockquote>/);
});

test("parseArticleMarkdown uses only the first level-one heading as title", () => {
  const result = parseArticleMarkdown({
    markdown: [
      "# 第一标题",
      "",
      "摘要。",
      "",
      "# 第二标题",
    ].join("\n"),
  });

  assert.equal(result.name, "第一标题");
  assert.match(result.contentHtml, /<h1>第二标题<\/h1>/);
});

test("parseArticleMarkdown rejects missing title, summary, and raw html", () => {
  assert.throws(
    () => parseArticleMarkdown({ markdown: "只有正文。" }),
    /level-one title/,
  );
  assert.throws(
    () => parseArticleMarkdown({ markdown: "# 只有标题" }),
    /summary/,
  );
  assert.throws(
    () =>
      parseArticleMarkdown({
        markdown: "# 标题\n\n摘要。\n\n<div>raw html</div>",
      }),
    /Raw HTML/,
  );
});

test("parseArticleMarkdown allows normal links and rejects unsafe protocols", () => {
  const result = parseArticleMarkdown({
    markdown: [
      "# 标题",
      "",
      "摘要。",
      "",
      "[外部链接](https://example.com) 与 [站内链接](/hub/articles)。",
    ].join("\n"),
  });

  assert.match(result.contentHtml, /href="https:\/\/example\.com"/);
  assert.match(result.contentHtml, /href="\/hub\/articles"/);
  assert.throws(
    () =>
      parseArticleMarkdown({
        markdown: "# 标题\n\n摘要。\n\n[危险链接](javascript:alert(1))",
      }),
    /Unsupported article link protocol/,
  );
});
