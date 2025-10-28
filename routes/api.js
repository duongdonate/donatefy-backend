const express = require("express");
const axios = require("axios");
const NodeCache = require("node-cache");
const axiosRetry = require("axios-retry").default;
const SearchHistory = require("../models/SearchHistory");
const CustomPlaylist = require("../models/CustomPlaylist");
const CustomSong = require("../models/CustomSong");
const getRandomPlaylistCover = require("../utils/randomPlaylistCover");
const parseToSeconds = require("../utils/parseToSeconds");

const Res = require("../utils/Res");

//Controllers
const songController = require("../controllers/songController");

const router = express.Router();

// Khởi tạo cache với TTL mặc định là 10 phút (600 giây)
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 }); // checkperiod: kiểm tra dữ liệu hết hạn mỗi 2 phút

// Cấu hình retry cho axios để xử lý rate limit

const checkApiKey = require("../middleware/checkApiKey");

// Endpoint để tìm kiếm video trên YouTube
router.get("/search", checkApiKey, async (req, res) => {
  const { q: query } = req.query;
  if (!query || query.trim() === "") {
    return res.status(400).json({ error: "Tham số tìm kiếm (q) là bắt buộc" });
  }
  if (query.length < 2) {
    return res.status(400).json({ error: "Query phải có ít nhất 2 ký tự" });
  }

  const cacheKey = `search_${query.toLowerCase()}`;
  const cacheData = cache.get(cacheKey);
  if (cacheData) {
    console.log("Trả về dữ liệu từ cache");
    return res
      .set("X-Cache", "hit")
      .json({ items: cacheData, fromCache: true }); // Thêm fromCache: true
  }

  try {
    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: {
          part: "snippet,contentDetails",
          maxResults: 20,
          q: query,
          type: "video",
          key: process.env.YOUTUBE_API_KEY,
        },
      }
    );
    const items = response.data.items
      .filter((item) => item.id.videoId)
      .map((item) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        artist: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails.default.url,
      }));
    cache.set(cacheKey, items);
    console.log(`Lưu dữ liệu vào cache: ${query}`);
    res.set("X-Cache", "miss").json({ items, fromCache: false }); // fromCache: false khi lấy từ API
  } catch (error) {
    console.error("Lỗi từ YouTube API:", error.message);
    res.status(500).json({ error: "Lỗi server", details: error.message });
  }
});

// Endpoint để lưu lịch sử tìm kiếm
// Trong router.js
router.post("/history", async (req, res) => {
  const { query } = req.body;
  if (!query || query.trim() === "") {
    return res.status(400).json({ error: "Query là bắt buộc" });
  }

  try {
    // Xóa các mục trùng lặp trước khi lưu
    await SearchHistory.deleteMany({ query: query.toLowerCase() });

    // Tạo mới mục lịch sử
    const newHistory = new SearchHistory({
      query: query.toLowerCase(),
      timestamp: new Date(),
    });
    await newHistory.save();
    res.status(200).json({ message: "Đã lưu lịch sử tìm kiếm" });
  } catch (error) {
    console.error("Lỗi khi lưu lịch sử tìm kiếm:", error.message);
    res
      .status(500)
      .json({ error: "Lỗi khi lưu lịch sử", details: error.message });
  }
});

// Endpoint để lấy lịch sử tìm kiếm
router.get("/history", async (req, res) => {
  try {
    const history = await SearchHistory.find()
      .sort({ timestamp: -1 })
      .limit(50); // Giới hạn tối đa 50 kết quả
    console.log(`Số lượng lịch sử tìm kiếm: ${history.length}`); // Log số lượng kết quả
    res.json(history);
  } catch (error) {
    console.error("Lỗi khi lấy lịch sử:", error.message);
    res
      .status(500)
      .json({ error: "Lỗi khi lấy lịch sử", details: error.message });
  }
});

// Endpoint để xóa toàn bộ lịch sử tìm kiếm
router.delete("/history", async (req, res) => {
  try {
    const result = await SearchHistory.deleteMany({});
    console.log(`Đã xóa ${result.deletedCount} lịch sử tìm kiếm`); // Log số lượng xóa
    res.json({ message: "Đã xóa toàn bộ lịch sử tìm kiếm" });
  } catch (error) {
    console.error("Lỗi khi xóa lịch sử:", error.message);
    res
      .status(500)
      .json({ error: "Lỗi khi xóa lịch sử", details: error.message });
  }
});

// Backend (thêm vào router.js)
router.delete("/history/:query", async (req, res) => {
  const { query } = req.params;
  try {
    const result = await SearchHistory.deleteOne({ query });
    res.json({ message: `Đã xóa lịch sử cho ${query}` });
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi xóa", details: error.message });
  }
});

// Endpoint để lấy thông tin video theo ID
router.get("/video/:id", checkApiKey, async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "videoId là bắt buộc" });
  }

  const cacheKey = `video_${id}`;
  const cacheData = cache.get(cacheKey);

  // Nếu có dữ liệu trong cache, trả về ngay lập tức
  if (cacheData) {
    console.log("Trả về dữ liệu từ cache"); // Log trả về từ cache
    return res.json(cacheData);
  }

  try {
    // Log request
    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/videos",
      {
        params: {
          part: "snippet",
          id,
          key: process.env.YOUTUBE_API_KEY,
        },
      }
    );

    if (!response.data.items || response.data.items.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy video" });
    }
    const item = response.data.items[0];
    const video = {
      id: item.id,
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.default.url,
    };

    // Lưu vào cache
    cache.set(cacheKey, video); // Lưu dữ liệu vào cache với key tương ứng
    console.log(`Lưu dữ liệu vào cache: ${id}`); // Log lưu thành công
    res.json(video);
  } catch (error) {
    if (error.response) {
      console.error("Lỗi từ YouTube API:", error.response.data);
      res.status(error.response.status).json({
        error: "Lỗi từ YouTube API",
        details: error.response.data,
      });
    } else {
      console.error("Lỗi khác:", error.message);
      res.status(500).json({ error: "Lỗi server", details: error.message });
    }
  }
});

// Tạo một playlist mới
router.post("/playlists", async (req, res) => {
  const { name, videos } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Tên playlist (name) là bắt buộc" });
  }

  try {
    const playlist = new CustomPlaylist({
      name,
      videos: videos || [],
      thumbnail: getRandomPlaylistCover(),
    });
    await playlist.save();
    console.log(`Đã tạo playlist: ${name}`); // Log tạo thành công
    res.status(201).json(playlist);
  } catch (error) {
    console.error("Lỗi khi tạo playlist:", error.message);
    res
      .status(500)
      .json({ error: "Lỗi khi tạo playlist", details: error.message });
  }
});

// Lấy tất cả playlists
router.get("/playlists", async (req, res) => {
  try {
    const playlists = await CustomPlaylist.find().sort({ createdAt: -1 });
    const playlistsWithShareUrl = playlists.map((playlist) => ({
      ...playlist._doc,
      shareUrl: `http://localhost:8404/playlist/${playlist._id}`, // Sửa thành cổng 8404
      cover: getRandomPlaylistCover(),
    }));
    Res.success(res, playlistsWithShareUrl, "Lấy playlists thành công");
  } catch (error) {
    console.error("Lỗi khi lấy playlists:", error.message);
    res
      .status(500)
      .json({ error: "Lỗi khi lấy playlists", details: error.message });
  }
});

router.post("/playlist/:id/add-song", async (req, res) => {
  const { id } = req.params;
  const { videoIds } = req.body;

  if (!videoIds) {
    return res.status(400).json({ error: "videoIds là bắt buộc" });
  }

  try {
    const playlist = await CustomPlaylist.findById(id);
    if (!playlist) {
      return res.status(404).json({ error: "Không tìm thấy playlist" });
    }
    if (!playlist.videos.includes(videoIds)) {
      playlist.videos.push(videoId);
      await playlist.save();
      console.log(`Đã thêm bài hát ${videoId} vào playlist ${id}`); // Log thêm thành công
    }
    res.json(playlist);
  } catch (error) {
    console.error("Lỗi khi thêm video vào playlist:", error.message);
    res
      .status(500)
      .json({ error: "Lỗi khi thêm video", details: error.message });
  }
});

router.post("/playlists/:id/remove-song", async (req, res) => {
  const { id } = req.params;
  const { videoId } = req.body;

  if (!videoId) {
    return res.status(400).json({ error: "videoId là bắt buộc" });
  }

  try {
    const playlist = await CustomPlaylist.findById(id);
    if (!playlist) {
      return res.status(404).json({ error: "Không tìm thấy playlist" });
    }

    playlist.videos = playlist.videos.filter((vid) => vid !== videoId);
    await playlist.save();
    console.log(`Đã xóa video ${videoId} khỏi playlist ${id}`); // Log xóa thành công
    res.json(playlist);
  } catch (error) {
    console.error("Lỗi khi xóa video khỏi playlist:", error.message);
    res
      .status(500)
      .json({ error: "Lỗi khi xóa video", details: error.message });
  }
});

router.get("/recommend", checkApiKey, async (req, res) => {
  const { videoId } = req.query;

  if (!videoId || typeof videoId !== "string" || videoId.length !== 11) {
    return res.status(400).json({ error: "Invalid or missing videoId" });
  }

  try {
    // Lấy thông tin video để biết channel
    const videoResponse = await axios.get(
      "https://www.googleapis.com/youtube/v3/videos",
      {
        params: {
          part: "snippet",
          id: videoId,
          key: process.env.YOUTUBE_API_KEY,
        },
      }
    );

    if (!videoResponse.data.items || videoResponse.data.items.length === 0) {
      return res.status(404).json({ error: "Video not found" });
    }

    const channelTitle = videoResponse.data.items[0].snippet.channelTitle;

    // Tìm kiếm video cùng channel
    const searchResponse = await axios.get(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: {
          part: "snippet",
          q: channelTitle,
          type: "video",
          maxResults: 10,
          key: process.env.YOUTUBE_API_KEY,
        },
      }
    );

    const recommendations = searchResponse.data.items
      .filter((item) => item.id.videoId && item.id.videoId !== videoId) // Loại bỏ video hiện tại
      .map((item) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        channel: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails.default.url,
      }));

    res.json(recommendations);
  } catch (error) {
    console.error(
      "Error fetching recommendations:",
      error.response?.data || error.message
    );
    res.status(error.response?.status || 500).json({
      error: "Failed to fetch recommendations",
      details: error.response?.data || error.message,
    });
  }
});

router.post("/songs/info", songController.createSongFromURL);

//Lấy tất cả songs trong playlist
router.get("/songs", songController.getSongs);

router.delete("/playlists/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const playlist = await CustomPlaylist.findByIdAndDelete(id);
    if (!playlist) {
      return res.status(404).json({ error: "Không tìm thấy playlist" });
    }
    console.log(`Đã xóa playlist ${id}`); // Log xóa thành công
    res.json({ message: `Đã xóa playlist thành công` });
  } catch (error) {
    console.error("Lỗi khi xóa playlist:", error.message);
    res
      .status(500)
      .json({ error: "Lỗi khi xóa playlist", details: error.message });
  }
});

module.exports = router;
