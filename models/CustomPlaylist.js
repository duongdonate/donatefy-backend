const mongoose = require("mongoose");

const customPlaylistSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Tên của danh sách phát
  videos: [{ type: String, ref: "CustomSong" }], // Danh sách video ID từ YouTube
  // Tên/kênh/bìa riêng của từng bài trong playlist này (videoId → meta), không ghi đè CustomSong
  meta: {
    type: Map,
    of: new mongoose.Schema({ name: String, artist: String, thumbnail: String }, { _id: false }),
    default: {},
  },
  thumbnail: { type: String }, // Ảnh đại diện
  createdAt: { type: Date, default: Date.now }, // Thời gian tạo
  userId: { type: String, ref: "User" }, // ID người dùng tạo danh sách phát
});

module.exports = mongoose.model("CustomPlaylist", customPlaylistSchema);
