const test = require("node:test");
const assert = require("node:assert/strict");
const { orderAndMerge, normalizeMeta } = require("./playlistSongs");

test("giữ thứ tự videos, bỏ id thiếu bài, ghi đè meta", () => {
  const songs = [{ id: "b", name: "B" }, { id: "a", name: "A", artist: "x" }];
  const out = orderAndMerge(["a", "zz", "b"], songs, { a: { name: "A mới" } });
  assert.deepEqual(out.map((s) => s.id), ["a", "b"]);
  assert.equal(out[0].name, "A mới");
  assert.equal(out[0].artist, "x");
  assert.equal(out[0].custom, true);
  assert.equal(out[1].custom, undefined);
});

test("meta là Map của mongoose", () => {
  const out = orderAndMerge(["a"], [{ id: "a", name: "A" }], new Map([["a", { artist: "y" }]]));
  assert.equal(out[0].artist, "y");
});

test("normalizeMeta", () => {
  const id = "jfKfPfyJRdk";
  assert.deepEqual(normalizeMeta(id, { name: "  Lofi  ", artist: "", thumbnail: `https://i.ytimg.com/vi/${id}/hq2.jpg` }),
    { ok: true, meta: { name: "Lofi", thumbnail: `https://i.ytimg.com/vi/${id}/hq2.jpg` } });
  assert.deepEqual(normalizeMeta(id, { name: "x".repeat(201) }), { ok: false, error: "Tên tối đa 200 ký tự" });
  assert.deepEqual(normalizeMeta(id, { thumbnail: "https://evil.com/a.jpg" }), { ok: false, error: "Ảnh bìa không hợp lệ" });
  assert.deepEqual(normalizeMeta(id, { thumbnail: "https://i.ytimg.com/vi/AAAAAAAAAAA/hq1.jpg" }), { ok: false, error: "Ảnh bìa không hợp lệ" });
});
