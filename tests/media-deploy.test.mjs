import assert from "node:assert/strict";
import test from "node:test";
import { diffMedia, normalizeMediaMap } from "../scripts/deploy-media.mjs";

const A = "a".repeat(64);
const B = "b".repeat(64);
const C = "c".repeat(64);

test("media diff skips a byte-identical deployment", () => {
  const diff = diffMedia({ "cover.png": A, "episode.png": B }, { "episode.png": B, "cover.png": A });
  assert.deepEqual(diff, { added: [], changed: [], removed: [], unchanged: 2, hasChanges: false });
});

test("media diff reports additions, replacements, and removals", () => {
  const diff = diffMedia({ "cover.png": B, "new.png": C }, { "cover.png": A, "old.png": C });
  assert.deepEqual(diff, {
    added: ["new.png"],
    changed: ["cover.png"],
    removed: ["old.png"],
    unchanged: 0,
    hasChanges: true,
  });
});

test("media maps reject unsafe object keys", () => {
  assert.throws(() => normalizeMediaMap({ "../secret.png": A }), /invalid entry/);
});
