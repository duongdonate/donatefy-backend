const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // decode token (chỉ lấy id, chưa find user)
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.userId = decoded.id; // gắn userId vô req
      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: "Unauthorized, token invalid" });
    }
  } else {
    return res.status(401).json({ message: "No token, not authorized" });
  }
};

module.exports = protect;
