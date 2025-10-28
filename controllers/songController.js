const songService = require("../services/songService");
const apiYoutubeService = require("../services/apiYoutubeService");
const parseToSeconds = require("../utils/parseToSeconds");

const Res = require("../utils/Res");

const getSongById = async (req, res) => {
  try {
    const song = await songService.getSongById(req.params.id);
    if (!song) {
      return Res.notFound(res, "Không tìm thấy bài hát");
    }
    Res.success(res, song, "Lấy bài hát thành công");
  } catch (error) {
    Res.error(res, "Lỗi khi lấy bài hát", 500, error.message);
  }
};

const createSong = async (req, res) => {
  try {
    const newSong = await songService.createSong(req.body);
    Res.success(res, newSong, "Tạo bài hát thành công", 201);
  } catch (error) {
    Res.error(res, "Lỗi khi tạo bài hát", 400, error.message);
  }
};

const updateSong = async (req, res) => {
  try {
    const updatedSong = await songService.updateSong(req.params.id, req.body);
    if (!updatedSong) {
      return Res.notFound(res, "Không tìm thấy bài hát để cập nhật");
    }
    Res.success(res, updatedSong, "Cập nhật bài hát thành công");
  } catch (error) {
    Res.error(res, "Lỗi khi cập nhật bài hát", 400, error.message);
  }
};

const getSongs = async (req, res) => {
  const { playlistId } = req.query;
  let isGetAll = false;
  if (!playlistId) {
    isGetAll = true;
  }

  try {
    let songs = [];
    if (isGetAll) {
      songs = await songService.getSongs();
      Res.success(res, songs, "Lấy tất cả bài hát thành công");
    } else {
      songs = await songService.getSongs(playlistId);
      Res.success(res, songs, "Lấy bài hát trong playlist thành công");
    }
  } catch (error) {
    Res.error(res, "Lỗi khi lấy danh sách bài hát", 500, error.message);
  }
};

const createSongFromURL = async (req, res) => {
  const { videoIds } = req.body;
  if (!videoIds || !Array.isArray(videoIds)) {
    return Res.badRequest(res, "videoIds phải là một mảng các ID video");
  }

  try {
    // Gọi YouTube Data API để lấy thông tin video
    const data = await apiYoutubeService.fetchYouTubeVideos(videoIds);

    // Chuyển đổi dữ liệu API thành định dạng phù hợp với CustomSong
    const videos = data.items.map((item) => ({
      id: item.id,
      name: item.snippet.title,
      artist: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.high.url,
      createdAt: item.snippet.publishedAt,
      duration: parseToSeconds(item.contentDetails.duration),
    }));

    videos.forEach((video) => {
      songService.createSong(video);
    });

    Res.success(res, videos, "Tạo bài hát từ URL thành công");
  } catch (error) {
    console.error("Error fetching video details:", error);
    Res.error(res, "Lỗi khi tạo bài hát từ URL", 500, error.message);
  }
};

module.exports = {
  getSongById,
  createSong,
  updateSong,
  getSongs,
  createSongFromURL,
};
