const HOSTS = ["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com"];
const PLAYLIST_ID = /^[\w-]+$/;
// Không đọc được bằng API key: Mix tự động (RD…), Đã thích (LL), Xem sau (WL)
const PRIVATE_LISTS = ["LL", "WL"];

const parsePlaylistUrl = (raw) => {
  let url;
  try {
    url = new URL(String(raw ?? "").trim());
  } catch {
    return { ok: false, error: "Link không hợp lệ" };
  }
  if (!["http:", "https:"].includes(url.protocol) || !HOSTS.includes(url.hostname)) {
    return { ok: false, error: "Chỉ hỗ trợ link YouTube" };
  }
  const playlistId = url.searchParams.get("list");
  if (!playlistId || !PLAYLIST_ID.test(playlistId)) {
    return { ok: false, error: "Link cần có tham số list= của playlist" };
  }
  if (playlistId.startsWith("RD")) {
    const videoId = url.searchParams.get("v");
    return {
      ok: false,
      error:
        "Đây là Mix tự động của YouTube, không nhập được. Mẹo: thêm các bài của Mix vào một playlist mới (Công khai hoặc Không công khai) rồi dán link playlist đó",
      // bài đang phát trong Mix, để frontend gợi ý thêm riêng bài này
      ...(/^[\w-]{11}$/.test(videoId ?? "") && { videoId }),
    };
  }
  if (PRIVATE_LISTS.includes(playlistId)) {
    return { ok: false, error: "Danh sách Đã thích / Xem sau là riêng tư, không nhập được" };
  }
  return { ok: true, playlistId };
};

module.exports = { parsePlaylistUrl };
