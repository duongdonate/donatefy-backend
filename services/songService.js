const { ownedFilter } = require("../utils/session");
const { orderAndMerge } = require("../utils/playlistSongs");
const CustomSong = require("../models/CustomSong");
const CustomPlaylist = require("../models/CustomPlaylist");

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
  getSongById,
  createSong,
  updateSong,
  getSongs,
};
