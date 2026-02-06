const { ClientError } = require("shokhijakhon-error-handler");
const jwtService = require("../lib/jwt");
const UserModel = require("../models/User.model");

module.exports = function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    // Check if Authorization header exists
    if (!authHeader) {
      throw new ClientError("Authorization header required", 401);
    }

    // Check if header starts with "Bearer "
    if (!authHeader.startsWith("Bearer ")) {
      throw new ClientError("Invalid authorization format. Use: Bearer <token>", 401);
    }

    // Extract token after "Bearer " (exactly 7 characters)
    const token = authHeader.substring(7);
    
    // Validate token is not empty
    if (!token || token.trim().length === 0) {
      throw new ClientError("Token required", 401);
    }

    // Verify token
    const data = jwtService.verifyToken(token);
    if (!data || !data.user_id) {
      throw new ClientError("Invalid token", 401);
    }
    
    req.user_id = data.user_id;
    next();
  } catch (err) {
    // Handle JWT specific errors
    if (err.name === 'TokenExpiredError') {
      return next(new ClientError("Token expired", 401));
    }
    if (err.name === 'JsonWebTokenError') {
      return next(new ClientError("Invalid token", 401));
    }
    next(err);
  }
};

