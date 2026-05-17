import test from "node:test";
import assert from "node:assert/strict";
import { resolveRoute } from "./route";

test("resolveRoute maps Shotmaker support URLs to support", () => {
  assert.deepEqual(resolveRoute("/shotmaker/"), { name: "support" });
  assert.deepEqual(resolveRoute("/shotmaker/support"), { name: "support" });
  assert.deepEqual(resolveRoute("/support"), { name: "support" });
});

test("resolveRoute maps Shotmaker privacy URLs to privacy", () => {
  assert.deepEqual(resolveRoute("/shotmaker/privacy"), { name: "privacy" });
  assert.deepEqual(resolveRoute("/privacy"), { name: "privacy" });
});

test("resolveRoute maps unknown Shotmaker URLs to not-found", () => {
  assert.deepEqual(resolveRoute("/shotmaker/missing"), { name: "not-found" });
});
