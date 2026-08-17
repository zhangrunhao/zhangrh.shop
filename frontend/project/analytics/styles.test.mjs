import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const styles = readFileSync(new URL("./styles.css", import.meta.url), "utf8");

test("Analytics chart styles keep values readable and touch targets usable", () => {
  assert.match(
    styles,
    /\.chart-figure\s*\{[^}]*overflow-x:\s*auto;/s,
  );
  assert.match(
    styles,
    /\.trend-chart\s*\{[^}]*min-width:\s*560px;[^}]*touch-action:\s*pan-x pan-y;/s,
  );
  assert.match(
    styles,
    /\.chart-value-label\s*\{[^}]*paint-order:\s*stroke;/s,
  );
  assert.match(
    styles,
    /\.chart-hit-area\s*\{[^}]*pointer-events:\s*all;/s,
  );
  assert.match(styles, /\.visually-hidden\s*\{/);
});
