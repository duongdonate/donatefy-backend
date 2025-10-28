const express = require("express");
const upload = require("../middleware/checkUploadAvatar.js");
const uploadAvatarController = require("../controllers/uploadAvatarController.js");

const router = express.Router();

router.post(
  "/avatars",
  upload.single("avatar"),
  uploadAvatarController.uploadImage
);

module.exports = router;
