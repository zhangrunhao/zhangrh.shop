import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { prepareArticles } from "./article-content-lib.mjs";

const makeWorkspace = () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "hub-articles-"));
  const articlesRoot = path.join(root, "articles");
  const generatedRoot = path.join(root, ".generated");
  fs.mkdirSync(articlesRoot, { recursive: true });
  return { root, articlesRoot, generatedRoot };
};

const writeArticle = ({
  articlesRoot,
  directoryName,
  markdown = "# 标题\n\n摘要。\n\n正文。",
  assets = {},
}) => {
  const articleDirectory = path.join(articlesRoot, directoryName);
  fs.mkdirSync(articleDirectory, { recursive: true });
  fs.writeFileSync(path.join(articleDirectory, "index.md"), markdown);
  for (const [relativePath, content] of Object.entries(assets)) {
    const assetPath = path.join(articleDirectory, "assets", relativePath);
    fs.mkdirSync(path.dirname(assetPath), { recursive: true });
    fs.writeFileSync(assetPath, content);
  }
  return articleDirectory;
};

test("prepareArticles writes an empty registry for an empty source tree", () => {
  const { articlesRoot, generatedRoot } = makeWorkspace();
  const result = prepareArticles({
    articlesRoot,
    generatedRoot,
    mode: "development",
  });

  assert.deepEqual(result.articles, []);
  assert.equal(result.articleCount, 0);
  assert.equal(result.imageCount, 0);
  assert.deepEqual(
    JSON.parse(
      fs.readFileSync(path.join(generatedRoot, "articles.json"), "utf8"),
    ),
    [],
  );
});

test("prepareArticles derives records and sorts newest articles first", () => {
  const { articlesRoot, generatedRoot } = makeWorkspace();
  writeArticle({
    articlesRoot,
    directoryName: "2026-07-25_100001_older-article",
    markdown: "# 较早文章\n\n较早摘要。\n\n正文。",
  });
  writeArticle({
    articlesRoot,
    directoryName: "2026-07-26_100002_newer-article",
    markdown: "# 较新文章\n\n> 较新摘要。\n\n正文。",
  });
  fs.writeFileSync(path.join(articlesRoot, "README.md"), "authoring rules");

  const result = prepareArticles({
    articlesRoot,
    generatedRoot,
    mode: "development",
  });

  assert.deepEqual(
    result.articles.map(({ id, name, summary, publishDate }) => ({
      id,
      name,
      summary,
      publishDate,
    })),
    [
      {
        id: "100002",
        name: "较新文章",
        summary: "较新摘要。",
        publishDate: "2026-07-26",
      },
      {
        id: "100001",
        name: "较早文章",
        summary: "较早摘要。",
        publishDate: "2026-07-25",
      },
    ],
  );
});

test("prepareArticles stages nested images and rewrites development urls", () => {
  const { articlesRoot, generatedRoot } = makeWorkspace();
  writeArticle({
    articlesRoot,
    directoryName: "2026-07-26_100001_image-article",
    markdown: [
      "# 图片文章",
      "",
      "图片摘要。",
      "",
      "![上下文图](./assets/diagrams/context.png)",
    ].join("\n"),
    assets: {
      "diagrams/context.png": "image-content",
    },
  });

  const result = prepareArticles({
    articlesRoot,
    generatedRoot,
    mode: "development",
  });

  assert.equal(result.imageCount, 1);
  assert.match(
    result.articles[0].contentHtml,
    /src="\/static\/articles\/100001\/diagrams\/context\.png"/,
  );
  assert.equal(
    fs.readFileSync(
      path.join(
        generatedRoot,
        "public",
        "static",
        "articles",
        "100001",
        "diagrams",
        "context.png",
      ),
      "utf8",
    ),
    "image-content",
  );
});

test("prepareArticles rewrites production image urls to OSS", () => {
  const { articlesRoot, generatedRoot } = makeWorkspace();
  writeArticle({
    articlesRoot,
    directoryName: "2026-07-26_100001_image-article",
    markdown: "# 图片文章\n\n图片摘要。\n\n![图](./assets/context.png)",
    assets: { "context.png": "image-content" },
  });

  const result = prepareArticles({
    articlesRoot,
    generatedRoot,
    mode: "production",
  });

  assert.match(
    result.articles[0].contentHtml,
    /src="https:\/\/static\.zhangrh\.shop\/zhangrh-shop\/hub\/static\/articles\/100001\/context\.png"/,
  );
});

test("prepareArticles rejects duplicate ids and malformed directories", () => {
  const duplicate = makeWorkspace();
  writeArticle({
    articlesRoot: duplicate.articlesRoot,
    directoryName: "2026-07-25_100001_first-article",
  });
  writeArticle({
    articlesRoot: duplicate.articlesRoot,
    directoryName: "2026-07-26_100001_second-article",
  });
  assert.throws(
    () =>
      prepareArticles({
        articlesRoot: duplicate.articlesRoot,
        generatedRoot: duplicate.generatedRoot,
        mode: "development",
      }),
    /Duplicate article id: 100001/,
  );

  const malformed = makeWorkspace();
  fs.mkdirSync(path.join(malformed.articlesRoot, "bad-directory"));
  assert.throws(
    () =>
      prepareArticles({
        articlesRoot: malformed.articlesRoot,
        generatedRoot: malformed.generatedRoot,
        mode: "development",
      }),
    /Invalid article directory name/,
  );
});

test("prepareArticles rejects invalid image sources", () => {
  const cases = [
    {
      href: "./assets/missing.png",
      expected: /Article image does not exist/,
    },
    {
      href: "../outside.png",
      expected: /must be stored under its assets directory/,
    },
    {
      href: "/tmp/absolute.png",
      expected: /must use a local relative path/,
    },
    {
      href:
        "https://prod-files-secure.s3.us-west-2.amazonaws.com/image.png?X-Amz-Signature=x",
      expected: /Notion temporary image URL/,
    },
  ];

  for (const [index, item] of cases.entries()) {
    const { articlesRoot, generatedRoot } = makeWorkspace();
    writeArticle({
      articlesRoot,
      directoryName: `2026-07-26_${String(100001 + index)}_invalid-image`,
      markdown: [
        "# 图片文章",
        "",
        "图片摘要。",
        "",
        `[普通链接](https://example.com)`,
        "",
        `![图](${item.href})`,
      ].join("\n"),
    });

    assert.throws(
      () =>
        prepareArticles({
          articlesRoot,
          generatedRoot,
          mode: "development",
        }),
      item.expected,
      item.href,
    );
  }
});

test("prepareArticles rejects unsafe generated targets and invalid modes", () => {
  const { articlesRoot, root } = makeWorkspace();

  assert.throws(
    () =>
      prepareArticles({
        articlesRoot,
        generatedRoot: root,
        mode: "development",
      }),
    /generated target must be named \.generated/,
  );
  assert.throws(
    () =>
      prepareArticles({
        articlesRoot,
        generatedRoot: path.join(root, ".generated"),
        mode: "preview",
      }),
    /Invalid article preparation mode/,
  );
});
