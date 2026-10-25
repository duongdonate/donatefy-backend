const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const { makeUsername } = require("../utils/googleUser");

const client = new OAuth2Client();

async function verifyGoogleCredential(credential) {
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const { sub, email, name, picture } = ticket.getPayload();
  return { sub, email, name, picture };
}

// Chỉ tìm theo googleId, không ghép theo email/username
async function findOrCreateGoogleUser({ sub, email, name, picture }) {
  const existing = await User.findOne({ googleId: sub });
  if (existing) {
    existing.displayName = name;
    existing.avatar = picture;
    return existing.save();
  }
  const source = email || name;
  for (let i = 0; i < 5; i++) {
    const suffix = i === 0 ? "" : "_" + (1000 + Math.floor(Math.random() * 9000));
    const username = makeUsername(source, suffix);
    if (await User.exists({ username })) continue;
    try {
      return await User.create({ username, googleId: sub, displayName: name, avatar: picture });
    } catch (err) {
      if (err.code !== 11000) throw err;
      const again = await User.findOne({ googleId: sub }); // đăng nhập song song cùng tài khoản
      if (again) return again;
    }
  }
  throw new Error("Không tạo được username");
}

module.exports = { verifyGoogleCredential, findOrCreateGoogleUser };
