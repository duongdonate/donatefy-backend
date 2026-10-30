const test = require("node:test");
const assert = require("node:assert/strict");
const { ensureSongs } = require("./songService");

const video = (id) => ({
  id,
  snippet: {
    title: `t-${id}`,
    channelTitle: "ch",
    thumbnails: { high: { url: `u-${id}` } },
    publishedAt: "2020-01-01T00:00:00Z",
  },
  contentDetails: { duration: "PT1M5S" },
});

// Song giả: lưu trong bộ nhớ, ném 11000 như Mongo khi trùng id
const makeDeps = ({ stored = [], gone = [] } = {}) => {
  const db = new Map(stored.map((id) => [id, { id }]));
  const calls = [];
  return {
    calls,
    db,
    Song: {
      find: async ({ id }) => id.$in.filter((v) => db.has(v)).map((v) => db.get(v)),
      insertMany: async (docs) => {
        docs.forEach((d) => db.set(d.id, d));
      },
    },
    fetchVideos: async (ids) => {
      calls.push(ids);
      return { items: ids.filter((v) => !gone.includes(v)).map(video) };
    },
  };
};

test("chia lô 50 id, không gọi lại bài đã có", async () => {
  const ids = Array.from({ length: 120 }, (_, i) => `v${i}`);
  const deps = makeDeps({ stored: ["v0"] });
  const { available } = await ensureSongs(ids, deps);
  assert.deepEqual(deps.calls.map((c) => c.length), [50, 50, 19]);
  assert.ok(!deps.calls.flat().includes("v0"));
  assert.equal(available.length, 120);
});

test("giữ thứ tự, bỏ trùng, tách bài không còn trên YouTube", async () => {
  const deps = makeDeps({ stored: ["b"], gone: ["x"] });
  const out = await ensureSongs(["c", "b", "x", "c", "a"], deps);
  assert.deepEqual(out.available, ["c", "b", "a"]);
  assert.deepEqual(out.unavailable, ["x"]);
});

test("lưu bài mới với duration tính bằng giây", async () => {
  const deps = makeDeps();
  await ensureSongs(["a"], deps);
  assert.equal(deps.db.get("a").duration, 65);
  assert.equal(deps.db.get("a").thumbnail, "u-a");
});

test("bỏ qua lỗi trùng 11000, ném lỗi khác", async () => {
  const deps = makeDeps();
  deps.Song.insertMany = async () => {
    throw Object.assign(new Error("dup"), { code: 11000 });
  };
  const out = await ensureSongs(["a"], deps);
  assert.deepEqual(out.available, ["a"]);

  deps.Song.insertMany = async () => {
    throw new Error("boom");
  };
  await assert.rejects(ensureSongs(["b"], deps), /boom/);
});

test("danh sách rỗng không gọi YouTube", async () => {
  const deps = makeDeps();
  const out = await ensureSongs([], deps);
  assert.deepEqual(out, { available: [], unavailable: [] });
  assert.equal(deps.calls.length, 0);
});
