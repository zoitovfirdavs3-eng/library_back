const { ClientError } = require("shokhijakhon-error-handler");

/**
 * Role-based access control middleware
 * @param {...string} allowedRoles - Roles that are allowed to access the route
 * @returns {Function} Express middleware function
 */
function permit(...allowedRoles) {
  return function (req, res, next) {
    try {
      // Check if user is authenticated
      if (!req.user_id) {
        throw new ClientError("Authentication required", 401);
      }

      // Check if user role is available
      if (!req.user_role) {
        throw new ClientError("User role not found", 401);
      }

      // Check if user role is in allowed roles
      if (!allowedRoles.includes(req.user_role)) {
        throw new ClientError("Insufficient permissions", 403);
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = permit;
