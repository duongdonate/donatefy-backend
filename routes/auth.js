// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const Avatar = require("../models/Avatar");
const checkRegister = require("../middleware/checkRegister");
const checkAuth = require("../middleware/checkAuth");

const secretKey = process.env.JWT_SECRET;

router.get("/me", checkAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!user.avatar) {
      return res.json({ user });
    } else {
      const avatar = await Avatar.findOne({ userId: user._id });
      if (avatar && avatar.filename) {
        user.avatar = `${req.protocol}://${req.get("host")}/uploads/avatars/${
          avatar.filename
        }`;
      } else {
        user.avatar = null;
      }
    }

    res.json({ user: user });
  } catch (error) {
    console.error("Fetch user error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const userFound = await User.findOne({ username });
    if (!userFound || !(await bcrypt.compare(password, userFound.password))) {
      return res
        .status(401)
        .json({ message: "Tên tài khoản hoặc mật khẩu không chính xác" });
    }

    const token = jwt.sign({ id: userFound._id }, secretKey, {
      expiresIn: "1h",
    });
    res.json({ access_token: token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

router.post("/register", checkRegister, async (req, res) => {
  const { username, password, avatar } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      password: hashedPassword,
      avatar: avatar || false,
    });
    newUser.save();

    if (avatar) {
      const newAvatar = new Avatar({
        userId: newUser._id,
        username: newUser.username,
      });
      newAvatar.save();
    }

    const token = jwt.sign({ id: newUser._id }, secretKey, {
      expiresIn: "1h",
    });
    res
      .status(201)
      .json({ message: "Đăng ký thành công", access_token: token });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;
