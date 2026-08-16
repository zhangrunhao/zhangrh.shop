import assert from "node:assert/strict";
import test from "node:test";

import { HUB_EVENTS, resolveHubPageEvent } from "./tracking";

test("Hub exposes only the five approved page events", () => {
  assert.deepEqual(HUB_EVENTS, [
    "home_page_load",
    "products_page_load",
    "articles_page_load",
    "article_detail_page_load",
    "about_page_load",
  ]);
});

test("Hub maps ordinary routes while deferring article details and ignoring 404", () => {
  assert.equal(resolveHubPageEvent({ name: "home" }), "home_page_load");
  assert.equal(
    resolveHubPageEvent({ name: "products" }),
    "products_page_load",
  );
  assert.equal(
    resolveHubPageEvent({ name: "articles" }),
    "articles_page_load",
  );
  assert.equal(resolveHubPageEvent({ name: "about" }), "about_page_load");
  assert.equal(
    resolveHubPageEvent({ name: "article-detail", articleId: "100002" }),
    null,
  );
  assert.equal(resolveHubPageEvent({ name: "not-found" }), null);
});
