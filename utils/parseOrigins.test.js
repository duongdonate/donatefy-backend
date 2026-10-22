const test = require("node:test");
const assert = require("node:assert/strict");
const parseOrigins = require("./parseOrigins");

test("tách FRONTEND_URL theo dấu phẩy, trim, bỏ rỗng và dấu / cuối", () => {
  assert.deepEqual(parseOrigins("a, b/ ,"), ["a", "b"]);
  assert.deepEqual(parseOrigins("http://localhost:3000"), ["http://localhost:3000"]);
  assert.deepEqual(parseOrigins(undefined), []);
});
