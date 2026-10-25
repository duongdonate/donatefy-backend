const fs = require("fs");
const path = require("path");

// Đọc danh sách ảnh bìa một lần khi nạp module
const images = fs
  .readdirSync(path.join(__dirname, "../public/img"))
  .filter((file) => /\.(jpg|jpeg|png|gif)$/.test(file));

function getRandomPlaylistCover() {
  const baseURL = process.env.BASE_URL || "http://localhost:8404"; // Lấy URL từ biến môi trường
  if (images.length === 0) {
    throw new Error("No images found in the directory");
  }

  const randomImage = images[Math.floor(Math.random() * images.length)];
  return `${baseURL}/img/${randomImage}`;
}

module.exports = getRandomPlaylistCover;
