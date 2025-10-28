// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true }, // Tên người dùng
  password: { type: String, required: true }, // Mật khẩu đã được mã hóa
  avatar: { type: Boolean, default: null, ref: "Avatar" }, // Tên file ảnh đại diện
});

module.exports = mongoose.model("User", userSchema);
