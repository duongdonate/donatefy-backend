const test = require("node:test");
const assert = require("node:assert/strict");
const { verifyGoogleCredential } = require("./googleAuth");

const res = (ok, body) => ({ ok, json: async () => body });
const fakeFetch = (tokeninfo, userinfo) => async (url) =>
  url.includes("tokeninfo") ? tokeninfo : userinfo;
const profile = { sub: "1", email: "a@x.com", name: "A", picture: "http://p" };

test("token đúng app → trả hồ sơ", async () => {
  const fetch = fakeFetch(res(true, { aud: "app", sub: "1" }), res(true, profile));
  assert.deepEqual(await verifyGoogleCredential("t", { clientId: "app", fetch }), profile);
});

test("token của app khác → ném lỗi", async () => {
  const fetch = fakeFetch(res(true, { aud: "khac", sub: "1" }), res(true, profile));
  await assert.rejects(verifyGoogleCredential("t", { clientId: "app", fetch }));
});

test("token sai, thiếu token, thiếu client id, sub lệch → ném lỗi", async () => {
  const ok = fakeFetch(res(true, { aud: "app", sub: "1" }), res(true, profile));
  await assert.rejects(verifyGoogleCredential("t", { clientId: "app", fetch: fakeFetch(res(false, {}), res(true, profile)) }));
  await assert.rejects(verifyGoogleCredential(undefined, { clientId: "app", fetch: ok }));
  await assert.rejects(verifyGoogleCredential("t", { clientId: "", fetch: ok }));
  const lech = fakeFetch(res(true, { aud: "app", sub: "1" }), res(true, { ...profile, sub: "2" }));
  await assert.rejects(verifyGoogleCredential("t", { clientId: "app", fetch: lech }));
});
