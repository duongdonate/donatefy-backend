const mongoose = require("mongoose");

const customSongSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // Id của song - link của youtube
  name: { type: String }, // Tên Bài Hát
  thumbnail: { type: String }, // Link ảnh của Song
  artist: { type: String }, // Tên nghệ sĩ
  createdAt: { type: Date }, // Thời gian tạo
  duration: { type: Number }, // Thời lượng bài hát (tính bằng giây)
  addedAt: { type: Date, default: Date.now }, // Thời gian thêm bài hát vào hệ thống
});

module.exports = mongoose.model("CustomSong", customSongSchema);
