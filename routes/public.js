const express = require("express");
const router = express.Router();
const CustomPlaylist = require("../models/CustomPlaylist");
const CustomSong = require("../models/CustomSong");
const path = require("path");
const Avatar = require("../models/Avatar");
const checkAuth = require("../middleware/checkAuth");
const { ownedFilter } = require("../utils/session");

router.get("/playlists/:id", checkAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const filter = ownedFilter(id, req.userId);
    const playlist = filter && (await CustomPlaylist.findOne(filter));
    if (!playlist) {
      return res.status(404).json({ error: "Không tìm thấy playlist" });
    }
    res.json({ ...playlist.toJSON(), cover: playlist.thumbnail });
  } catch (error) {
    console.error("Lỗi khi lấy playlist:", error.message);
    res.status(500).json({ error: "Lỗi server", details: error.message });
  }
});

router.get("/songs/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const song = await CustomSong.findOne({ id: id });
    if (!song) {
      return res.status(404).json({ error: "Không tìm thấy song" });
    }
    res.json(song);
  } catch (error) {
    console.error("Lỗi khi lấy song:", error.message);
    res.status(500).json({ error: "Lỗi server", details: error.message });
  }
});

router.get("/avatars/:username", async (req, res) => {
  const { username } = req.params;
  try {
    const avatar = await Avatar.findOne({ username });
    if (!avatar || !avatar.filename) {
      return res.status(404).json({ message: "Avatar not found" });
    }

    // Đường dẫn file trong hệ thống
    const filePath = path.join(
      __dirname,
      "../uploads/avatars/",
      avatar.filename,
    );
    res.sendFile(filePath);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;
