import test from "node:test";
import assert from "node:assert/strict";
import { resolveRoute } from "./route";

test("resolveRoute maps /zhengtian to the dedicated page", () => {
  assert.deepEqual(resolveRoute("/zhengtian"), { name: "zhengtian" });
});

test("resolveRoute maps articles and removes old content paths", () => {
  assert.deepEqual(resolveRoute("/articles"), { name: "articles" });
  assert.deepEqual(resolveRoute("/ideas"), { name: "not-found" });
  assert.deepEqual(resolveRoute("/reviews"), { name: "not-found" });
  assert.deepEqual(resolveRoute("/previews"), { name: "not-found" });
});
