const User = require("../models/User"); // Adjust the path as necessary

const checkUsernameExists = async (req, res, next) => {
  const { username } = req.body;

  try {
    const user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ message: "Username đã tồn tại" });
    }
    next();
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

module.exports = checkUsernameExists;
