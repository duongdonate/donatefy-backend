const axios = require("axios");
const axiosRetry = require("axios-retry").default;

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

axiosRetry(axios, {
  retries: 3, // Thử lại 3 lần nếu gặp lỗi
  retryDelay: (retryCount) => retryCount * 1000, // Delay tăng dần: 1s, 2s, 3s
  retryCondition: (error) => {
    return (
      error.response &&
      (error.response.status === 429 || error.response.status === 503)
    );
  },
});

const fetchYouTubeVideos = async (videoIds) => {
  const res = await axios.get("https://www.googleapis.com/youtube/v3/videos", {
    params: {
      part: "snippet,contentDetails",
      id: videoIds.join(","),
      key: YOUTUBE_API_KEY, // Đảm bảo API key được cấu hình
    },
  });

  return res.data;
};

const MAX_IMPORT = 500; // 10 trang × 50: giữ quota thấp

// Gom videoId theo thứ tự playlist qua các trang; fetchPage(pageToken) trả dữ liệu playlistItems.list
const collectPlaylistIds = async (fetchPage, max = MAX_IMPORT) => {
  const videoIds = [];
  const seen = new Set();
  let pageToken;
  do {
    const page = await fetchPage(pageToken);
    for (const item of page.items ?? []) {
      const id = item.contentDetails?.videoId;
      if (!id || seen.has(id)) continue;
      if (videoIds.length >= max) return { videoIds, truncated: true };
      seen.add(id);
      videoIds.push(id);
    }
    pageToken = page.nextPageToken;
  } while (pageToken);
  return { videoIds, truncated: false };
};

const fetchPlaylistVideoIds = (playlistId, max = MAX_IMPORT) =>
  collectPlaylistIds(async (pageToken) => {
    const res = await axios.get("https://www.googleapis.com/youtube/v3/playlistItems", {
      params: {
        part: "contentDetails",
        playlistId,
        maxResults: 50,
        pageToken,
        key: YOUTUBE_API_KEY,
      },
    });
    return res.data;
  }, max);

// Tên playlist gốc; undefined nếu không thấy
const fetchPlaylistTitle = async (playlistId) => {
  const res = await axios.get("https://www.googleapis.com/youtube/v3/playlists", {
    params: { part: "snippet", id: playlistId, key: YOUTUBE_API_KEY },
  });
  return res.data.items?.[0]?.snippet?.title;
};

// Lỗi YouTube đã biết → { status, error } cho người dùng; null nếu không nhận ra (để route trả 500)
const youtubeErrorResponse = (err) => {
  const status = err.response?.status;
  const reason = err.response?.data?.error?.errors?.[0]?.reason;
  if (reason === "quotaExceeded" || reason === "dailyLimitExceeded") {
    return { status: 503, error: "Đã hết hạn mức YouTube hôm nay, hãy thử lại sau" };
  }
  // Playlist riêng tư cũng trả 404 (đo được thực tế), không phải 403
  if (status === 404 || reason === "playlistItemsNotAccessible") {
    return { status: 422, error: "Playlist không công khai hoặc không tồn tại" };
  }
  return null;
};

module.exports = {
  fetchYouTubeVideos,
  collectPlaylistIds,
  youtubeErrorResponse,
  fetchPlaylistVideoIds,
  fetchPlaylistTitle,
};
