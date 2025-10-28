// uploadAvatarController.js
const Avatar = require("../models/Avatar");

const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const filename = req.savedFilename;
    const username = req.body.username;

    // Cập nhật bản ghi Avatar
    const avatar = await Avatar.findOneAndUpdate(
      { username },
      { filename, uploadedAt: Date.now() }
    );

    return res.status(201).json({
      message: "Upload success",
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports = {
  uploadImage,
};
