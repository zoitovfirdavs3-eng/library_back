const { Router } = require("express");
const router = Router();

const authWithRole = require("../utils/authWithRole.middleware");
const permit = require("../utils/permit.middleware");
const UserModel = require("../models/User.model");
const userController = require("../controllers/user.controller");

// User profile routes - authenticated users
router.get("/me", authWithRole, authWithRole.withRole, userController.ME);
router.patch("/me", authWithRole, authWithRole.withRole, userController.UPDATE_ME);

// Admin routes - admin and super_admin can manage users
router.get("/", authWithRole, authWithRole.withRole, permit("admin", "super_admin"), async (req, res, next) => {
  try {
    const users = await UserModel.find().select("-password");
    return res.json({ status: 200, users });
  } catch (err) {
    next(err);
  }
});

router.post("/", authWithRole, authWithRole.withRole, permit("admin", "super_admin"), async (req, res, next) => {
  try {
    const { first_name, last_name, email, password, role } = req.body;

    // Validate required fields
    if (!first_name || !last_name || !email || !password) {
      throw new ClientError("first_name, last_name, email, password required", 400);
    }

    // Validate role if provided
    if (role && !["user", "admin"].includes(role)) {
      throw new ClientError("Invalid role. Only 'user' or 'admin' allowed", 400);
    }

    // Check if user already exists
    const exists = await UserModel.findOne({ email });
    if (exists) {
      throw new ClientError("Email already exists", 409);
    }

    // Hash password
    const bcrypt = require("bcrypt");
    const hash = await bcrypt.hash(password, 10);

    // Create user
    const user = await UserModel.create({
      first_name: String(first_name).trim(),
      last_name: String(last_name).trim(),
      email: String(email).toLowerCase().trim(),
      password: hash,
      role: role || "user",
    });

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    return res.status(201).json({
      message: "User created successfully",
      status: 201,
      user: userResponse,
    });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", authWithRole, authWithRole.withRole, permit("admin", "super_admin"), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, email, role } = req.body;

    // Validate ObjectId
    const mongoose = require("mongoose");
    if (!mongoose.isValidObjectId(id)) {
      throw new ClientError("Invalid user id", 400);
    }

    // Find user
    const user = await UserModel.findById(id);
    if (!user) {
      throw new ClientError("User not found", 404);
    }

    // Prevent modifying super_admin unless you are super_admin
    if (user.role === "super_admin" && req.user_role !== "super_admin") {
      throw new ClientError("Cannot modify super_admin", 403);
    }

    // Validate role if provided
    if (role && !["user", "admin"].includes(role)) {
      throw new ClientError("Invalid role. Only 'user' or 'admin' allowed", 400);
    }

    // Update user
    const updateData = {};
    if (first_name) updateData.first_name = String(first_name).trim();
    if (last_name) updateData.last_name = String(last_name).trim();
    if (email) updateData.email = String(email).toLowerCase().trim();
    if (role !== undefined) updateData.role = role;

    const updatedUser = await UserModel.findByIdAndUpdate(id, updateData, { new: true }).select("-password");

    return res.json({
      message: "User updated successfully",
      status: 200,
      user: updatedUser,
    });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", authWithRole, authWithRole.withRole, permit("admin", "super_admin"), async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    const mongoose = require("mongoose");
    if (!mongoose.isValidObjectId(id)) {
      throw new ClientError("Invalid user id", 400);
    }

    // Find user
    const user = await UserModel.findById(id);
    if (!user) {
      throw new ClientError("User not found", 404);
    }

    // Prevent deleting super_admin unless you are super_admin
    if (user.role === "super_admin" && req.user_role !== "super_admin") {
      throw new ClientError("Cannot delete super_admin", 403);
    }

    // Prevent self-deletion
    if (user._id.toString() === req.user_id.toString()) {
      throw new ClientError("Cannot delete your own account", 403);
    }

    await UserModel.findByIdAndDelete(id);

    return res.json({
      message: "User deleted successfully",
      status: 200,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;