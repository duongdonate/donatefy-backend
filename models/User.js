// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true }, // Tên người dùng
  password: { type: String, required: true }, // Mật khẩu đã được mã hóa
  avatar: { type: String, default: null }, // URL của ảnh đại diện
});

module.exports = mongoose.model("User", userSchema);
