const fs = require("fs");
const path = require("path");

function getRandomPlaylistCover() {
  const imagesDir = path.join(__dirname, "../public/img");
  const images = fs
    .readdirSync(imagesDir)
    .filter((file) => /\.(jpg|jpeg|png|gif)$/.test(file));

  if (images.length === 0) {
    throw new Error("No images found in the directory");
  }

  const randomImage = images[Math.floor(Math.random() * images.length)];
  return `http://localhost:8404/img/${randomImage}`;
}

module.exports = getRandomPlaylistCover;
