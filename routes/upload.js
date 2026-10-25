const express = require("express");
const checkAuth = require("../middleware/checkAuth.js");
const upload = require("../middleware/checkUploadAvatar.js");
const uploadAvatarController = require("../controllers/uploadAvatarController.js");
const User = require("../models/User");

const router = express.Router();

// Tên file/bản ghi avatar lấy từ người dùng trong token, không tin form
const loadUsername = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    req.username = user.username;
    next();
  } catch (err) {
    next(err);
  }
};

router.post(
  "/avatars",
  checkAuth,
  loadUsername,
  upload.single("avatar"),
  uploadAvatarController.uploadImage
);

module.exports = router;
