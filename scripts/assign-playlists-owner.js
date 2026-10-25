// Dùng: node scripts/assign-playlists-owner.js <username> [--dry-run]
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const CustomPlaylist = require("../models/CustomPlaylist");

const username = process.argv[2];
const dryRun = process.argv.includes("--dry-run");

(async () => {
  if (!username || username.startsWith("--")) {
    console.error("Dùng: node scripts/assign-playlists-owner.js <username> [--dry-run]");
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  try {
    const user = await User.findOne({ username });
    if (!user) {
      console.error(`Không tìm thấy người dùng "${username}"`);
      process.exitCode = 1;
      return;
    }
    const filter = { $or: [{ userId: { $exists: false } }, { userId: null }, { userId: "" }] };
    const n = await CustomPlaylist.countDocuments(filter);
    console.log(`Tìm thấy ${n} playlist chưa có chủ`);
    if (dryRun || n === 0) return;
    const r = await CustomPlaylist.updateMany(filter, { $set: { userId: String(user._id) } });
    console.log(`Đã gán ${r.modifiedCount} playlist cho ${username}`);
  } finally {
    await mongoose.disconnect();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
