// Đoạn sau "|" có chữ nhiễu (nhãn video, tên chương trình) thì bỏ cả đoạn; đoạn đầu luôn giữ
const NOISE = /official|music video|\bm\/?v\b|lyrics?|audio|visualizer|karaoke|the masked singer/i;

// Tên video YouTube → tối đa 2 phần ["A", "B"] để tìm lời; chưa biết bên nào là ca sĩ (nơi gọi thử cả hai chiều)
const cleanTitle = (raw) =>
  String(raw ?? "")
    .split("|")
    .filter((seg, i) => i === 0 || !NOISE.test(seg))
    .join(" - ")
    .replace(/[([][^)\]]*[)\]]/g, " ") // (official audio), [Lyric Video], (prod. by …)
    .replace(/['"‘’“”]/g, "")
    .split(/\s+[-–—]\s+/)
    .map((part) =>
      part
        .replace(/\s+(ft|feat)\.?\s.*$/i, "") // khách mời
        .replace(/\s+aka\s.*$/i, "") // "Cú Tây Bắc aka Danh ca Hương Lan"
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean)
    .slice(0, 2);

module.exports = { cleanTitle };
