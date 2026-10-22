// FRONTEND_URL có thể là danh sách cách nhau bằng dấu phẩy (vd. localhost + link xem thử Vercel)
const parseOrigins = (value = "") =>
  value.split(",").map((s) => s.trim().replace(/\/$/, "")).filter(Boolean);

module.exports = parseOrigins;
