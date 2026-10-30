const FIELDS = ["name", "artist", "thumbnail"];

// Bài theo đúng thứ tự videos, đè tên/kênh/bìa riêng của playlist (meta) lên bài gốc
const orderAndMerge = (videos, songs, meta) => {
  const byId = new Map(songs.map((s) => [s.id, s.toObject ? s.toObject() : s]));
  return videos.filter((id) => byId.has(id)).map((id) => {
    const song = { ...byId.get(id) };
    const m = meta?.get ? meta.get(id) : meta?.[id];
    const over = FIELDS.filter((f) => m?.[f]);
    over.forEach((f) => (song[f] = m[f]));
    if (over.length) song.custom = true;
    return song;
  });
};

const normalizeMeta = (videoId, input = {}) => {
  const meta = {};
  for (const f of ["name", "artist"]) {
    const v = typeof input[f] === "string" ? input[f].trim() : "";
    if (v.length > 200) return { ok: false, error: "Tên tối đa 200 ký tự" };
    if (v) meta[f] = v;
  }
  if (input.thumbnail) {
    const ok = typeof input.thumbnail === "string" && /^[\w-]{11}$/.test(videoId) &&
      new RegExp(`^https://i\.ytimg\.com/vi/${videoId}/(hqdefault|hq1|hq2|hq3)\.jpg$`).test(input.thumbnail);
    if (!ok) return { ok: false, error: "Ảnh bìa không hợp lệ" };
    meta.thumbnail = input.thumbnail;
  }
  return { ok: true, meta };
};

// Bài mới của playlist nguồn (giữ thứ tự nguồn): chưa có trong playlist và không phải bài người dùng đã xoá
const newFromSource = (sourceIds, videos, removedIds = []) => {
  const skip = new Set([...videos, ...removedIds]);
  return sourceIds.filter((id) => !skip.has(id));
};

module.exports = { orderAndMerge, normalizeMeta, newFromSource };
