import assert from "node:assert/strict";
import test from "node:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { App, DEFAULT_TRACK_QUERY, ErrorNotice } from "./app";

test("Analytics defaults to Hub for thirty days", () => {
  assert.deepEqual(DEFAULT_TRACK_QUERY, { project: "hub", days: 30 });
});

test("Analytics first render exposes filters and loading status", () => {
  const html = renderToStaticMarkup(createElement(App));

  assert.match(html, /Track 概览/);
  assert.match(html, /<option value="hub" selected="">Hub<\/option>/);
  assert.match(html, /<option value="30" selected="">30 天<\/option>/);
  assert.match(html, /正在加载汇总数据/);
  assert.doesNotMatch(html, /全部项目/);
});

test("ErrorNotice renders a retryable safe message", () => {
  const html = renderToStaticMarkup(
    createElement(ErrorNotice, {
      message: "数据格式异常，请重试。",
      loading: false,
      onRetry: () => undefined,
    }),
  );

  assert.match(html, /role="alert"/);
  assert.match(html, /数据格式异常，请重试/);
  assert.match(html, />重试<\/button>/);
});
