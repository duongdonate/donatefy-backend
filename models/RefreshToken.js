const mongoose = require("mongoose");

// Một document = một phiên đăng nhập; tự xoá khi hết hạn.
const refreshTokenSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  tokenHash: { type: String, index: true },
  prevHash: { type: String, index: true },
  rotatedAt: Date,
  expiresAt: Date,
});
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("RefreshToken", refreshTokenSchema, "refresh_tokens");
