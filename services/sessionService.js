const jwt = require("jsonwebtoken");
const RefreshToken = require("../models/RefreshToken");
const {
  ACCESS_TTL, REFRESH_MS, COOKIE,
  newRefreshToken, hashToken, refreshCookieOptions, checkRefresh,
} = require("../utils/session");

const sign = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: ACCESS_TTL });

const cookieOpts = () => refreshCookieOptions(process.env.BASE_URL);
// clearCookie cần cùng path/sameSite/secure (không kèm maxAge)
const clearOpts = () => {
  const { maxAge, ...opts } = cookieOpts();
  return opts;
};

async function issueSession(res, userId) {
  const token = newRefreshToken();
  await RefreshToken.create({
    userId: String(userId),
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + REFRESH_MS),
  });
  res.cookie(COOKIE, token, cookieOpts());
  return { access_token: sign(String(userId)) };
}

async function refreshSession(req, res) {
  const token = req.cookies?.[COOKIE];
  if (token) {
    const hash = hashToken(token);
    const doc = await RefreshToken.findOne({ $or: [{ tokenHash: hash }, { prevHash: hash }] });
    const state = checkRefresh(doc, hash, new Date());
    if (state === "current") {
      const next = newRefreshToken();
      // Xoay nguyên tử: nếu request khác đã xoay trước thì không khớp, rơi về grace.
      const rotated = await RefreshToken.findOneAndUpdate(
        { _id: doc._id, tokenHash: hash },
        { $set: {
          prevHash: hash,
          tokenHash: hashToken(next),
          rotatedAt: new Date(),
          expiresAt: new Date(Date.now() + REFRESH_MS),
        } },
      );
      if (rotated) res.cookie(COOKIE, next, cookieOpts());
      return { access_token: sign(doc.userId) };
    }
    if (state === "grace") return { access_token: sign(doc.userId) };
  }
  res.clearCookie(COOKIE, clearOpts());
  return null;
}

async function endSession(req, res) {
  const token = req.cookies?.[COOKIE];
  if (token) {
    const h = hashToken(token);
    await RefreshToken.deleteOne({ $or: [{ tokenHash: h }, { prevHash: h }] });
  }
  res.clearCookie(COOKIE, clearOpts());
}

module.exports = { issueSession, refreshSession, endSession };
