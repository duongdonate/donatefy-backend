const mongoose = require("mongoose");

const avatarSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true }, // ID người dùng
  username: { type: String, required: true }, // Tên người dùng
  filename: { type: String, default: null }, // Tên file ảnh đại diện
  uploadedAt: { type: Date, default: Date.now }, // Thời gian tải lên
});

module.exports = mongoose.model("Avatar", avatarSchema);
