// index.js
require("dotenv").config(); // Chỉ gọi một lần
const express = require("express");
const connectDB = require("./db.js");
const cors = require("cors");
const path = require("path");

const app = express();
const port = process.env.PORT || 8404; // Thêm giá trị mặc định nếu PORT không được định nghĩa
const listEndpoints = require("express-list-endpoints");

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL, // Đổi thành port của frontend React
    credentials: true,
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.options("*", cors());
connectDB();

const apiRoutes = require("./routes/api");
const publicRoutes = require("./routes/public");
const authRoutes = require("./routes/auth");
const uploadRoutes = require("./routes/upload");

app.use("/api", apiRoutes);
app.use("/", publicRoutes);
app.use("/api/auth", authRoutes);
app.use("/upload", uploadRoutes);
// Cấu hình để phục vụ tệp tĩnh từ thư mục
app.use("/img", express.static(path.join(__dirname, "public/img")));
app.use(
  "/uploads/avatars",
  express.static(path.join(__dirname, "uploads/avatars"))
);

// Routes
// setup view engine
app.set("view engine", "ejs");
app.set("views", "./views");
// route "/" hiển thị list endpoint
app.get("/", (req, res) => {
  const endpoints = listEndpoints(app);

  // groupBy theo prefix
  const grouped = [];
  endpoints
    .filter((ep) => ep.path !== "*" && ep.path !== "/") // loại bỏ path * và /
    .forEach((ep) => {
      const prefix = ep.path.split("/")[1] || "/";
      const key = prefix === "" ? "/" : "/" + prefix;

      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(ep);
    });

  grouped.forEach((prefix) => {
    grouped[prefix].sort((a, b) => a.path.localeCompare(b.path));
  });

  grouped.filter((group) => group.length > 0 && group !== "//");

  res.render("index", { grouped });
});

// Xử lý lỗi chung
function handleError(error, res) {
  if (error.response) {
    console.log("Lỗi từ YouTube:", error.response.data);
    res.status(error.response.status).json(error.response.data);
  } else {
    console.log("Lỗi khác:", error.message);
    res.status(500).send("Lỗi: " + error.message);
  }
}

// Khởi động server
app.listen(port, () => {
  console.log(`Server chạy trên http://localhost:${port}`);
});
