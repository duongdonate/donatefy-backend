const test = require("node:test");
const assert = require("node:assert/strict");
const { cleanTitle } = require("./lyricsQuery");

// 16 tên thật từ lần thử LRCLIB; chưa biết bên nào là ca sĩ nên chỉ kiểm thứ tự tách
const CASES = [
  ["Mẹ Ơi Mai Con Về - Cú Tây Bắc aka Danh ca Hương Lan | The Masked Singer Vietnam", ["Mẹ Ơi Mai Con Về", "Cú Tây Bắc"]],
  ["một phần hai ½ - Voi Bản Đôn aka Anh Tú x OgeNus | The Masked Singer Vietnam", ["một phần hai ½", "Voi Bản Đôn"]],
  ["Có Đau Thì Đau Một Mình - Ong Bây Bi aka Orange | The Masked Singer Vietnam", ["Có Đau Thì Đau Một Mình", "Ong Bây Bi"]],
  ["Nhắn Gió Mây Rằng Anh Yêu Em - Bố Gấu aka Hoàng Hải | The Masked Singer Vietnam", ["Nhắn Gió Mây Rằng Anh Yêu Em", "Bố Gấu"]],
  ["THE WOODLOGS x JINY - TRÊN CHUYẾN XE 2 NGƯỜI | OFFICIAL MUSIC VIDEO", ["THE WOODLOGS x JINY", "TRÊN CHUYẾN XE 2 NGƯỜI"]],
  ["tình ca tình ta - kis (official audio)", ["tình ca tình ta", "kis"]],
  ["Có Hẹn Với Thanh Xuân - MONSTAR | Official Music Video", ["Có Hẹn Với Thanh Xuân", "MONSTAR"]],
  ["SƠN TÙNG M-TP | CHÚNG TA CỦA HIỆN TẠI | OFFICIAL MUSIC VIDEO", ["SƠN TÙNG M-TP", "CHÚNG TA CỦA HIỆN TẠI"]],
  ["HIEUTHUHAI - NGỦ MỘT MÌNH (tình rất tình) ft. Negav (prod. by Kewtiie) | Official Music Video", ["HIEUTHUHAI", "NGỦ MỘT MÌNH"]],
  ["Đen - Bài này chill phết ft. MIN (M/V)", ["Đen", "Bài này chill phết"]],
  ["Vũ. - Lạ Lùng (Official MV)", ["Vũ.", "Lạ Lùng"]],
  ["MONO - 'Waiting For You' (Album 22 - Track No.10)", ["MONO", "Waiting For You"]],
  ["Hoàng Thùy Linh - See Tình (Official Music Video)", ["Hoàng Thùy Linh", "See Tình"]],
  ["buitruonglinh - Đường Tôi Chở Em Về | Official Music Video", ["buitruonglinh", "Đường Tôi Chở Em Về"]],
  ["Ed Sheeran - Shape of You (Official Music Video)", ["Ed Sheeran", "Shape of You"]],
  ["Taylor Swift - Anti-Hero (Official Music Video)", ["Taylor Swift", "Anti-Hero"]],
];

test("cleanTitle: 16 tên YouTube thật", () => {
  for (const [raw, want] of CASES) assert.deepEqual(cleanTitle(raw), want, raw);
});

test("cleanTitle: trường hợp biên", () => {
  assert.deepEqual(cleanTitle("Lạc Trôi"), ["Lạc Trôi"]); // không có dấu tách
  assert.deepEqual(cleanTitle(""), []);
  assert.deepEqual(cleanTitle(undefined), []);
  assert.deepEqual(cleanTitle("A ft. B - Tên Bài"), ["A", "Tên Bài"]); // ft. ở phần đầu không được nuốt tên bài
  assert.deepEqual(cleanTitle("Ca Sĩ – Tên Bài [Lyric Video]"), ["Ca Sĩ", "Tên Bài"]); // gạch dài, ngoặc vuông
  assert.deepEqual(cleanTitle("Tên Bài | Official Lyric Video"), ["Tên Bài"]);
});
