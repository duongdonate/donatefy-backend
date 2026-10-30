const test = require("node:test");
const assert = require("node:assert/strict");
const { collectPlaylistIds, youtubeErrorResponse } = require("./apiYoutubeService");

// Lỗi axios giả theo dạng lỗi của YouTube Data API
const ytError = (status, reason) => ({
  response: { status, data: { error: { code: status, errors: reason ? [{ reason }] : [] } } },
});

test("ánh xạ lỗi YouTube sang phản hồi cho người dùng", () => {
  // 404 là mã thật đo được khi nhập playlist riêng tư (TC9)
  assert.equal(youtubeErrorResponse(ytError(404, "playlistNotFound")).status, 422);
  assert.equal(youtubeErrorResponse(ytError(403, "playlistItemsNotAccessible")).status, 422);
  assert.equal(youtubeErrorResponse(ytError(403, "quotaExceeded")).status, 503);
  assert.equal(youtubeErrorResponse(ytError(400, "keyInvalid")), null);
  assert.equal(youtubeErrorResponse(new Error("ECONNRESET")), null);
});

// Trang giả theo dạng playlistItems.list (part=contentDetails)
const pager = (pages) => {
  const tokens = [];
  const fetchPage = async (pageToken) => {
    tokens.push(pageToken);
    const i = pageToken ? Number(pageToken) : 0;
    return {
      items: pages[i].map((videoId) => (videoId ? { contentDetails: { videoId } } : {})),
      ...(i + 1 < pages.length ? { nextPageToken: String(i + 1) } : {}),
    };
  };
  return { fetchPage, tokens };
};

test("đi hết các trang, giữ thứ tự, bỏ trùng và item thiếu videoId", async () => {
  const { fetchPage, tokens } = pager([["a", "b"], ["b", null, "c"], ["d"]]);
  const out = await collectPlaylistIds(fetchPage);
  assert.deepEqual(out, { videoIds: ["a", "b", "c", "d"], truncated: false });
  assert.deepEqual(tokens, [undefined, "1", "2"]);
});

test("cắt ở max và báo truncated, không đọc trang thừa", async () => {
  const { fetchPage, tokens } = pager([["a", "b"], ["c", "d"], ["e"]]);
  const out = await collectPlaylistIds(fetchPage, 3);
  assert.deepEqual(out, { videoIds: ["a", "b", "c"], truncated: true });
  assert.equal(tokens.length, 2);
});

test("vừa đúng max mà hết trang thì không truncated", async () => {
  const { fetchPage } = pager([["a", "b"], ["c"]]);
  assert.deepEqual(await collectPlaylistIds(fetchPage, 3), {
    videoIds: ["a", "b", "c"],
    truncated: false,
  });
});

test("playlist rỗng", async () => {
  const { fetchPage } = pager([[]]);
  assert.deepEqual(await collectPlaylistIds(fetchPage), { videoIds: [], truncated: false });
});
