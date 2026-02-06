const jwt = require("jsonwebtoken");

module.exports = {
  createToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || "7d",
    });
  },

  verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
  },
};
