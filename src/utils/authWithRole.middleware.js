const { ClientError } = require("shokhijakhon-error-handler");
const UserModel = require("../models/User.model");

module.exports = function authWithRole(req, res, next) {
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
    const jwtService = require("../lib/jwt");
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

// Middleware to fetch user role from database
module.exports.withRole = async function withRole(req, res, next) {
  try {
    if (!req.user_id) {
      throw new ClientError("User not authenticated", 401);
    }

    const user = await UserModel.findById(req.user_id).select("role");
    if (!user) {
      throw new ClientError("User not found", 404);
    }

    req.user_role = user.role;
    next();
  } catch (err) {
    next(err);
  }
};
