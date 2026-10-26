const User = require("../models/User");
const { makeUsername } = require("../utils/googleUser");

// Access token từ popup OAuth (useGoogleLogin): hỏi Google token cấp cho app nào, rồi lấy hồ sơ
async function verifyGoogleCredential(accessToken, { clientId = process.env.GOOGLE_CLIENT_ID, fetch = globalThis.fetch } = {}) {
  if (!clientId) throw new Error("Thiếu GOOGLE_CLIENT_ID");
  if (typeof accessToken !== "string" || !accessToken) throw new Error("Thiếu access token");
  const info = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`);
  const token = info.ok ? await info.json() : {};
  // token cấp cho app khác thì không nhận, kẻo app đó dùng lại token của người dùng để vào đây
  if (token.aud !== clientId) throw new Error("Token không dành cho app này");
  const me = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!me.ok) throw new Error("Không lấy được hồ sơ Google");
  const { sub, email, name, picture } = await me.json();
  if (!sub || sub !== token.sub) throw new Error("Hồ sơ Google không khớp token");
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
