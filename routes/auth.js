// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/User");
const Avatar = require("../models/Avatar");
const checkRegister = require("../middleware/checkRegister");
const checkAuth = require("../middleware/checkAuth");
const { verifyGoogleCredential, findOrCreateGoogleUser } = require("../services/googleAuth");
const { issueSession, refreshSession, endSession } = require("../services/sessionService");

router.get("/me", checkAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (Boolean.valueOf(user.avatar) == false || /^http/.test(user.avatar)) {
      return res.json({ user });
    } else {
      const avatar = await Avatar.findOne({ userId: user._id });
      if (avatar && avatar.filename) {
        user.avatar = `${process.env.BASE_URL}/uploads/avatars/${avatar.filename}`;
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
    if (!userFound || !userFound.password || !(await bcrypt.compare(password, userFound.password))) {
      return res
        .status(401)
        .json({ message: "Tên tài khoản hoặc mật khẩu không chính xác" });
    }

    res.json(await issueSession(res, String(userFound._id)));
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

router.post("/google", async (req, res) => {
  let payload;
  try {
    payload = await verifyGoogleCredential(req.body?.credential);
  } catch {
    return res.status(401).json({ message: "Đăng nhập Google thất bại" });
  }
  try {
    const user = await findOrCreateGoogleUser(payload);
    res.json(await issueSession(res, String(user._id)));
  } catch (error) {
    console.error("Google login error:", error);
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

    if (avatar) {
      const newAvatar = new Avatar({
        userId: newUser._id,
        username: newUser.username,
      });
      await newAvatar.save();
    }

    res
      .status(201)
      .json({ message: "Đăng ký thành công", ...(await issueSession(res, String(newUser._id))) });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

router.post("/refresh", async (req, res) => {
  try {
    const session = await refreshSession(req, res);
    if (!session) {
      return res
        .status(401)
        .json({ message: "Phiên đăng nhập đã hết, vui lòng đăng nhập lại" });
    }
    res.json(session);
  } catch (error) {
    console.error("Refresh error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

router.post("/logout", async (req, res) => {
  try {
    await endSession(req, res);
    res.sendStatus(204);
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;
