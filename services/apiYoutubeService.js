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

module.exports = {
  fetchYouTubeVideos,
};
