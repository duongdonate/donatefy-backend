const crypto = require("node:crypto");
const mongoose = require("mongoose");

const ACCESS_TTL = "1h";
const REFRESH_MS = 7 * 24 * 3600 * 1000;
const GRACE_MS = 30 * 1000;
const COOKIE = "refresh_token";

const newRefreshToken = () => crypto.randomBytes(32).toString("base64url");
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

function refreshCookieOptions(baseUrl) {
  const https = String(baseUrl || "").startsWith("https");
  return { httpOnly: true, path: "/api/auth", maxAge: REFRESH_MS, sameSite: https ? "none" : "lax", secure: https };
}

function checkRefresh(doc, hash, now) {
  if (!doc) return null;
  if (hash === doc.tokenHash) return doc.expiresAt > now ? "current" : null;
  if (doc.prevHash && hash === doc.prevHash && doc.rotatedAt && now - doc.rotatedAt < GRACE_MS) return "grace";
  return null;
}

function ownedFilter(id, userId) {
  if (!userId || !mongoose.isValidObjectId(id)) return null;
  return { _id: id, userId };
}

module.exports = { ACCESS_TTL, REFRESH_MS, GRACE_MS, COOKIE, newRefreshToken, hashToken, refreshCookieOptions, checkRefresh, ownedFilter };
