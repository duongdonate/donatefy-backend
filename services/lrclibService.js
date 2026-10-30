const { cleanTitle } = require("../utils/lyricsQuery");

const API = "https://lrclib.net/api/search";
const UA = "Donatefy (https://donatefy.vercel.app)"; // LRCLIB yêu cầu User-Agent nhận diện app
const TIMEOUT_MS = 10000; // tổng cho mọi lần thử; đo thực tế mỗi request LRCLIB 1–3,4s
const MAX_DRIFT_SEC = 5; // lệch thời lượng tối đa giữa bản LRCLIB và video

// Bản khớp đầu: có lời, lệch thời lượng ≤ 5s (nếu biết); ưu tiên bản đồng bộ
const pick = (list, durationSec) => {
  const ok = list.filter(
    (r) => (r.syncedLyrics || r.plainLyrics) && (!durationSec || Math.abs(r.duration - durationSec) <= MAX_DRIFT_SEC),
  );
  return ok.find((r) => r.syncedLyrics) ?? ok[0] ?? null;
};

// Tìm lời trên LRCLIB. title: tên video (hoặc tên đã sửa), artist: kênh / ca sĩ (tuỳ chọn), durationSec: thời lượng video.
// Trả { provider, syncLevel, synced, plain } hoặc null nếu không thấy; lỗi mạng / HTTP thì ném lỗi để nơi gọi không cache "không thấy".
async function search({ title, artist, durationSec, fetch = globalThis.fetch }) {
  const [a, b] = cleanTitle(title);
  if (!a) return null;
  const by = cleanTitle(artist)[0];
  // Chưa biết bên nào là ca sĩ: thử cả hai chiều, rồi tìm tự do
  const tries = b
    ? [{ track_name: a, artist_name: b }, { track_name: b, artist_name: a }, { q: `${a} ${b}` }]
    : by
      ? [{ track_name: a, artist_name: by }, { q: `${a} ${by}` }]
      : [{ q: a }];

  const signal = AbortSignal.timeout(TIMEOUT_MS);
  for (const params of tries) {
    const res = await fetch(`${API}?${new URLSearchParams(params)}`, { headers: { "User-Agent": UA }, signal });
    if (!res.ok) throw new Error(`LRCLIB trả HTTP ${res.status}`);
    const r = pick(await res.json(), durationSec);
    if (r) {
      return {
        provider: "lrclib",
        syncLevel: r.syncedLyrics ? "line" : "plain",
        synced: r.syncedLyrics || null,
        plain: r.plainLyrics || null,
      };
    }
  }
  return null;
}

module.exports = { search };
