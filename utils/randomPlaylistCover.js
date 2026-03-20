const fs = require("fs");
const path = require("path");

function getRandomPlaylistCover() {
  const baseURL = process.env.BASE_URL || "http://localhost:8404"; // Lấy URL từ biến môi trường
  const imagesDir = path.join(__dirname, "../public/img");
  const images = fs
    .readdirSync(imagesDir)
    .filter((file) => /\.(jpg|jpeg|png|gif)$/.test(file));

  if (images.length === 0) {
    throw new Error("No images found in the directory");
  }

  const randomImage = images[Math.floor(Math.random() * images.length)];
  return `${baseURL}/img/${randomImage}`;
}

module.exports = getRandomPlaylistCover;
