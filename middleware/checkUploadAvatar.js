const multer = require("multer");
const path = require("path");

// config storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/avatars/"); // folder lưu file
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase(); // lấy đuôi file
    const username = req.body.username || "unknown"; // lấy username từ form-data
    const filename = `${username}${ext}`; // đặt tên file là username + đuôi file
    req.savedFilename = filename; // lưu tên file vào req để dùng sau này
    cb(null, filename);
  },
});

// chỉ cho phép ảnh
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif/;
  const extname = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowed.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Only images are allowed!"));
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
