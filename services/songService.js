const { ownedFilter } = require("../utils/session");
const { orderAndMerge } = require("../utils/playlistSongs");
const CustomSong = require("../models/CustomSong");
const CustomPlaylist = require("../models/CustomPlaylist");
const apiYoutubeService = require("./apiYoutubeService");
const parseToSeconds = require("../utils/parseToSeconds");

const YT_BATCH = 50; // videos.list nhận tối đa 50 id mỗi lần

// Đảm bảo mọi id đều có trong CustomSong: chỉ lấy từ YouTube bài chưa có, không ghi đè bài đã có.
// available: id dùng được (giữ thứ tự vào); unavailable: id YouTube không trả về (link hỏng / đã xoá).
const ensureSongs = async (
  videoIds,
  { Song = CustomSong, fetchVideos = apiYoutubeService.fetchYouTubeVideos } = {},
) => {
  const ids = [...new Set(videoIds)];
  const have = new Set((await Song.find({ id: { $in: ids } })).map((s) => s.id));
  const missing = ids.filter((v) => !have.has(v));

  const fetched = [];
  for (let i = 0; i < missing.length; i += YT_BATCH) {
    const data = await fetchVideos(missing.slice(i, i + YT_BATCH));
    fetched.push(
      ...data.items.map((item) => ({
        id: item.id,
        name: item.snippet.title,
        artist: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails.high.url,
        createdAt: item.snippet.publishedAt,
        duration: parseToSeconds(item.contentDetails.duration),
      })),
    );
  }
  if (fetched.length) {
    await Song.insertMany(fetched, { ordered: false }).catch((e) => {
      if (e.code !== 11000) throw e; // bài vừa được tạo song song thì bỏ qua
    });
  }

  const ok = new Set([...have, ...fetched.map((v) => v.id)]);
  return {
    available: ids.filter((v) => ok.has(v)),
    unavailable: ids.filter((v) => !ok.has(v)),
  };
};

const getSongById = async (id) => {
  return await CustomSong.findOne({ id: id });
};

const createSong = async (songData) => {
  const newSong = new CustomSong(songData);
  return await newSong.save();
};

const updateSong = async (id, songData) => {
  return await CustomSong.findByIdAndUpdate(id, songData, { new: true });
};

// Không có playlistId: tất cả bài. Có: bài theo thứ tự thêm, kèm tên/bìa riêng; null nếu không có playlist
const getSongs = async (playlistId = null, userId) => {
  if (!playlistId) return await CustomSong.find();
  const filter = ownedFilter(playlistId, userId);
  const playlist = filter && (await CustomPlaylist.findOne(filter));
  if (!playlist) return null;
  const songs = await CustomSong.find({ id: { $in: playlist.videos } });
  return orderAndMerge(playlist.videos, songs, playlist.meta);
};

module.exports = {
  ensureSongs,
  getSongById,
  createSong,
  updateSong,
  getSongs,
};
