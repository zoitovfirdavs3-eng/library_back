const { ClientError } = require("shokhijakhon-error-handler");
const UserModel = require("../models/User.model");

module.exports = async function admin(req, res, next) {
  try {
    // Get user from database to check role
    const user = await UserModel.findById(req.user_id).select("role");
    if (!user) throw new ClientError("User not found", 404);

    if (user.role !== "admin") {
      throw new ClientError("Admin access required", 403);
    }

    next();
  } catch (err) {
    next(err);
  }
};
