const test = require("node:test");
const assert = require("node:assert/strict");
const { makeUsername } = require("./googleUser");

const VALID = /^[A-Za-z0-9_.]{3,30}$/;

test("lấy phần trước @", () => {
  assert.equal(makeUsername("duong.hnh@gmail.com"), "duong.hnh");
});

test("bỏ dấu, khoảng trắng thành _", () => {
  assert.equal(makeUsername("Dương Hải"), "Duong_Hai");
});

test("quá ngắn thì đệm user", () => {
  assert.match(makeUsername("ab@x.com"), VALID);
});

test("quá dài cộng suffix vẫn đúng 30", () => {
  const r = makeUsername("a".repeat(50), "_1234");
  assert.equal(r.length, 30);
  assert.ok(r.endsWith("_1234"));
});

test("không có __", () => {
  const r = makeUsername("a  b!!c@x");
  assert.ok(!r.includes("__"));
  assert.match(r, VALID);
});
