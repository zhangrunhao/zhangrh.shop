import assert from "node:assert/strict";
import test from "node:test";

import { buildTrackUrl, track } from "./track";

test("buildTrackUrl emits exactly the three approved query parameters", () => {
  const url = new URL(
    buildTrackUrl({
      project: "hub",
      event: "home_page_load",
      device_id: "AbCd1234Ef56",
    }),
    "https://zhangrh.shop",
  );

  assert.equal(url.pathname, "/track");
  assert.deepEqual(
    [...url.searchParams.entries()].sort(([left], [right]) =>
      left.localeCompare(right),
    ),
    [
      ["device_id", "AbCd1234Ef56"],
      ["event", "home_page_load"],
      ["project", "hub"],
    ],
  );
});

test("track returns only the server-bound payload and stays safe without a window", () => {
  const payload = track({ project: "hub", event: "home_page_load" });

  assert.deepEqual(Object.keys(payload).sort(), ["device_id", "event", "project"]);
  assert.equal(payload.project, "hub");
  assert.equal(payload.event, "home_page_load");
  assert.match(payload.device_id, /^[A-Za-z0-9]{12}$/);
});
