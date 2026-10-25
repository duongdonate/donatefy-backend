// Tạo username hợp lệ ([A-Za-z0-9_.], 3–30 ký tự) từ email hoặc tên Google
const MAX = 30;

function makeUsername(source, suffix = "") {
  let base = String(source || "")
    .split("@")[0]
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9_.]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, MAX - suffix.length);
  if (base.length < 3) base = ("user" + base).slice(0, MAX - suffix.length);
  return base + suffix;
}

module.exports = { makeUsername };
