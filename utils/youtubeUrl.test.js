const test = require("node:test");
const assert = require("node:assert/strict");
const { parsePlaylistUrl } = require("./youtubeUrl");

const ID = "PLx0sYbCqOb8TBPRdmBHs5Iftvv9TPboYG";

test("nhận các host YouTube có list=", () => {
  for (const url of [
    `https://www.youtube.com/playlist?list=${ID}`,
    `https://youtube.com/watch?v=jfKfPfyJRdk&list=${ID}&index=3`,
    `http://m.youtube.com/playlist?list=${ID}`,
    `https://music.youtube.com/playlist?list=${ID}`,
    `  https://www.youtube.com/playlist?list=${ID}  `,
  ]) {
    assert.deepEqual(parsePlaylistUrl(url), { ok: true, playlistId: ID }, url);
  }
});

test("từ chối URL sai, host lạ, thiếu list", () => {
  for (const url of [
    "",
    undefined,
    "không phải url",
    `ftp://youtube.com/playlist?list=${ID}`,
    `https://evil.com/playlist?list=${ID}`,
    `https://youtube.com.evil.com/playlist?list=${ID}`,
    "https://www.youtube.com/watch?v=jfKfPfyJRdk",
    "https://www.youtube.com/playlist?list=",
    "https://www.youtube.com/playlist?list=bad id!",
  ]) {
    assert.equal(parsePlaylistUrl(url).ok, false, String(url));
  }
});

test("từ chối mix tự động và danh sách riêng tư, thông báo riêng từng loại", () => {
  const parse = (list) => parsePlaylistUrl(`https://www.youtube.com/watch?v=qBsiWmEdj0c&list=${list}`);
  for (const list of ["RDPNhYz6RmIr4", "RDCLAK5uy_abc"]) {
    assert.equal(parse(list).ok, false, list);
    assert.match(parse(list).error, /Mix tự động/);
    assert.equal(parse(list).videoId, "qBsiWmEdj0c");
  }
  const noVideo = parsePlaylistUrl("https://www.youtube.com/playlist?list=RDPNhYz6RmIr4");
  assert.equal(noVideo.videoId, undefined);
  for (const list of ["LL", "WL"]) {
    assert.equal(parse(list).ok, false, list);
    assert.match(parse(list).error, /Đã thích \/ Xem sau/);
  }
});
