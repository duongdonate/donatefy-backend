const test = require("node:test");
const assert = require("node:assert/strict");
const { search } = require("./lrclibService");

const hit = (o) => ({ trackName: "x", artistName: "y", duration: 200, syncedLyrics: null, plainLyrics: null, ...o });

// fetch giả: answer(params) trả danh sách kết quả cho từng lần gọi; ghi lại tham số đã gọi
const fakeFetch = (answer, { status = 200 } = {}) => {
  const calls = [];
  const fetch = async (url, opts) => {
    const params = Object.fromEntries(new URL(url).searchParams);
    calls.push(params);
    assert.match(opts.headers["User-Agent"], /Donatefy/);
    return { ok: status === 200, status, json: async () => answer(params) };
  };
  return { fetch, calls };
};

test("thử (bài, ca sĩ) → (ca sĩ, bài) → q; dừng ở lần đầu có bản khớp", async () => {
  const { fetch, calls } = fakeFetch((p) =>
    p.track_name === "Lạ Lùng" && p.artist_name === "Vũ." ? [hit({ syncedLyrics: "[00:01.00] a" })] : [],
  );
  const out = await search({ title: "Vũ. - Lạ Lùng (Official MV)", durationSec: 200, fetch });
  assert.deepEqual(calls, [
    { track_name: "Vũ.", artist_name: "Lạ Lùng" },
    { track_name: "Lạ Lùng", artist_name: "Vũ." },
  ]);
  assert.deepEqual(out, { provider: "lrclib", syncLevel: "line", synced: "[00:01.00] a", plain: null });
});

test("lọc lệch thời lượng quá 5 giây; trong ngưỡng thì ưu tiên bản đồng bộ", async () => {
  const { fetch } = fakeFetch(() => [
    hit({ duration: 300, syncedLyrics: "sai bài" }), // lệch 100s
    hit({ duration: 203, plainLyrics: "lời thường" }),
    hit({ duration: 198, syncedLyrics: "đúng", plainLyrics: "đúng" }),
  ]);
  const out = await search({ title: "A - B", durationSec: 200, fetch });
  assert.equal(out.synced, "đúng");

  const onlyFar = fakeFetch(() => [hit({ duration: 300, syncedLyrics: "sai bài" })]);
  assert.equal(await search({ title: "A - B", durationSec: 200, fetch: onlyFar.fetch }), null);
  assert.equal(onlyFar.calls.length, 3); // thử hết rồi mới chịu
});

test("không biết thời lượng: lấy bản đầu có lời, ưu tiên đồng bộ; lời thường → syncLevel plain", async () => {
  const { fetch } = fakeFetch(() => [hit({ duration: 999, plainLyrics: "p" }), hit({ plainLyrics: "q" })]);
  const out = await search({ title: "A - B", fetch });
  assert.deepEqual(out, { provider: "lrclib", syncLevel: "plain", synced: null, plain: "p" });
});

test("tên một phần: dùng ca sĩ (kênh) nếu có, không thì chỉ q", async () => {
  const withArtist = fakeFetch(() => []);
  await search({ title: "Lạc Trôi", artist: "Sơn Tùng M-TP | Official", fetch: withArtist.fetch });
  assert.deepEqual(withArtist.calls, [
    { track_name: "Lạc Trôi", artist_name: "Sơn Tùng M-TP" },
    { q: "Lạc Trôi Sơn Tùng M-TP" },
  ]);

  const alone = fakeFetch(() => []);
  await search({ title: "Lạc Trôi", fetch: alone.fetch });
  assert.deepEqual(alone.calls, [{ q: "Lạc Trôi" }]);
});

test("tên rỗng thì không gọi; LRCLIB lỗi HTTP thì ném lỗi (không coi là không thấy)", async () => {
  const none = fakeFetch(() => []);
  assert.equal(await search({ title: "  ", fetch: none.fetch }), null);
  assert.equal(none.calls.length, 0);

  const down = fakeFetch(() => [], { status: 503 });
  await assert.rejects(search({ title: "A - B", fetch: down.fetch }), /LRCLIB/);
});
