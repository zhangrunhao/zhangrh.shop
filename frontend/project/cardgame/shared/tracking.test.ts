import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { CARDGAME_EVENTS } from "./tracking";

const appSource = readFileSync(new URL("../app.tsx", import.meta.url), "utf8");

test("Cardgame exposes the page load and six approved action events", () => {
  assert.deepEqual(CARDGAME_EVENTS, [
    "cardgame_page_load",
    "create_room_click",
    "join_room_click",
    "ai_battle_click",
    "play_cards_click",
    "round_confirm_click",
    "play_again_click",
  ]);
});

test("Cardgame app tracks one load and uses complete action event names", () => {
  assert.match(appSource, /trackCardgameEvent\('cardgame_page_load'\)/);
  assert.match(appSource, /pageLoadTrackedRef/);

  for (const event of CARDGAME_EVENTS.slice(1)) {
    assert.match(appSource, new RegExp(`trackCardgameEvent\\('${event}'\\)`));
  }

  assert.doesNotMatch(appSource, /event:\s*'click'/);
  assert.doesNotMatch(appSource, /params:\s*\{\s*button/);
});
