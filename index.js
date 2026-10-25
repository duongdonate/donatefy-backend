// index.js
require("dotenv").config(); // Chỉ gọi một lần
const express = require("express");
const connectDB = require("./db.js");
const cors = require("cors");
const path = require("path");
const parseOrigins = require("./utils/parseOrigins");

const app = express();
const port = process.env.PORT || 8404; // Thêm giá trị mặc định nếu PORT không được định nghĩa
const listEndpoints = require("express-list-endpoints");

// Middleware
app.use(express.json());
const corsOptions = {
  origin: parseOrigins(process.env.FRONTEND_URL), // Chỉ các địa chỉ frontend liệt kê trong FRONTEND_URL
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
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
  express.static(path.join(__dirname, "uploads/avatars")),
);

// Routes
// setup view engine
app.set("view engine", "ejs");
app.set("views", "./views");
// "/" mở thẳng tài liệu API
app.get("/", (req, res) => res.redirect("/docs"));

// "/endpoints" hiển thị list endpoint
app.get("/endpoints", (req, res) => {
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

// Set up Redoc documentation route
const redoc = require("redoc-express");
const YAML = require("yamljs");

app.get(
  "/docs",
  redoc({
    title: "API Docs",
    specUrl: "/openapi.yml",
    redocOptions: {
      hideDownloadButton: false,
      hideHostname: true,

      theme: {
        colors: {
          primary: {
            main: "#6366f1", // indigo dịu
          },

          text: {
            primary: "#334155", // xám đậm (đỡ gắt hơn đen)
            secondary: "#64748b",
          },

          background: {
            primary: "#f8fafc", // trắng pha xám nhẹ
          },

          http: {
            get: "#22c55e",
            post: "#3b82f6",
            put: "#eab308",
            delete: "#ef4444",
          },
        },

        sidebar: {
          backgroundColor: "#f1f5f9",
          textColor: "#475569",
          activeTextColor: "#111827",
        },

        rightPanel: {
          backgroundColor: "#64748e",
        },

        typography: {
          fontFamily: "Inter, system-ui, sans-serif",

          headings: {
            fontWeight: "600",
            color: "#0f172a",
          },

          code: {
            backgroundColor: "#e2e8f0",
            color: "#1e293b",
          },
        },
      },
    },
  }),
);

app.get("/openapi.yml", (req, res) => {
  res.sendFile(path.join(__dirname, "docs/openapi.yml"));
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
