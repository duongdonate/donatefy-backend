const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const {
  REFRESH_MS, GRACE_MS, newRefreshToken, hashToken, refreshCookieOptions, checkRefresh, ownedFilter,
} = require("./session");

test("hashToken ổn định, khác input thì khác; newRefreshToken không trùng", () => {
  assert.equal(hashToken("a"), hashToken("a"));
  assert.notEqual(hashToken("a"), hashToken("b"));
  const t = newRefreshToken();
  assert.ok(t.length >= 43);
  assert.notEqual(t, newRefreshToken());
});

test("refreshCookieOptions theo BASE_URL", () => {
  const base = { httpOnly: true, path: "/api/auth", maxAge: REFRESH_MS };
  assert.deepEqual(refreshCookieOptions("https://x"), { ...base, sameSite: "none", secure: true });
  assert.deepEqual(refreshCookieOptions("http://localhost:8404"), { ...base, sameSite: "lax", secure: false });
  assert.deepEqual(refreshCookieOptions(undefined), { ...base, sameSite: "lax", secure: false });
});

test("checkRefresh: current / grace / null", () => {
  const now = new Date("2026-01-10T00:00:00Z");
  const doc = {
    tokenHash: "cur",
    prevHash: "old",
    rotatedAt: new Date(now - 10 * 1000),
    expiresAt: new Date(now.getTime() + 1000),
  };
  assert.equal(checkRefresh(null, "cur", now), null);
  assert.equal(checkRefresh(doc, "cur", now), "current");
  assert.equal(checkRefresh({ ...doc, expiresAt: new Date(now.getTime() - 1) }, "cur", now), null);
  assert.equal(checkRefresh(doc, "old", now), "grace");
  assert.equal(checkRefresh({ ...doc, rotatedAt: new Date(now - GRACE_MS - 1) }, "old", now), null);
  assert.equal(checkRefresh(doc, "lạ", now), null);
});

test("ownedFilter", () => {
  const id = new mongoose.Types.ObjectId().toString();
  assert.equal(ownedFilter("abc", "u1"), null);
  assert.equal(ownedFilter(id, undefined), null);
  assert.deepEqual(ownedFilter(id, "u1"), { _id: id, userId: "u1" });
});
