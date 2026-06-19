import test from "node:test";
import assert from "node:assert/strict";
import { resolveRoute } from "./route";

const OLD_PROJECT_SLUG = "shot" + "maker";

test("resolveRoute maps ShotMarker support URLs to support", () => {
  assert.deepEqual(resolveRoute("/shotmarker/"), { name: "support" });
  assert.deepEqual(resolveRoute("/shotmarker/support"), { name: "support" });
  assert.deepEqual(resolveRoute("/support"), { name: "support" });
});

test("resolveRoute maps ShotMarker privacy URLs to privacy", () => {
  assert.deepEqual(resolveRoute("/shotmarker/privacy"), { name: "privacy" });
  assert.deepEqual(resolveRoute("/privacy"), { name: "privacy" });
});

test("resolveRoute maps ShotMarker how-to URLs to how-to", () => {
  assert.deepEqual(resolveRoute("/shotmarker/how-to"), { name: "how-to" });
  assert.deepEqual(resolveRoute("/how-to"), { name: "how-to" });
});

test("resolveRoute maps unknown ShotMarker URLs to not-found", () => {
  assert.deepEqual(resolveRoute("/shotmarker/missing"), { name: "not-found" });
  assert.deepEqual(resolveRoute(`/${OLD_PROJECT_SLUG}/support`), { name: "not-found" });
});
