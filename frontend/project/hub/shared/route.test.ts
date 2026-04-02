import test from "node:test";
import assert from "node:assert/strict";
import { resolveRoute } from "./route";

test("resolveRoute maps /zhengtian to the dedicated page", () => {
  assert.deepEqual(resolveRoute("/zhengtian"), { name: "zhengtian" });
});
