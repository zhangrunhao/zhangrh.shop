import test from "node:test";
import assert from "node:assert/strict";
import { resolveRoute, withBase } from "./route";

test("WebTrace routes its public root, support, and privacy pages", () => {
  assert.deepEqual(resolveRoute("/webtrace/"), { name: "home" });
  assert.deepEqual(resolveRoute("/"), { name: "home" });
  assert.deepEqual(resolveRoute("/webtrace/support"), { name: "support" });
  assert.deepEqual(resolveRoute("/support"), { name: "support" });
  assert.deepEqual(resolveRoute("/webtrace/privacy"), { name: "privacy" });
  assert.deepEqual(resolveRoute("/privacy"), { name: "privacy" });
});

test("WebTrace keeps how-to and unknown paths outside its route contract", () => {
  assert.deepEqual(resolveRoute("/webtrace/how-to"), { name: "not-found" });
  assert.deepEqual(resolveRoute("/how-to"), { name: "not-found" });
  assert.deepEqual(resolveRoute("/webtrace/missing"), { name: "not-found" });
});

test("WebTrace produces stable project-relative links", () => {
  assert.equal(withBase("/"), "/");
  assert.equal(withBase("support"), "/support");
  assert.equal(withBase("/privacy"), "/privacy");
});
