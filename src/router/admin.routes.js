const { Router } = require("express");
const router = Router();

const authWithRole = require("../utils/authWithRole.middleware");
const permit = require("../utils/permit.middleware");
const UserModel = require("../models/User.model");
const bcrypt = require("bcrypt");
const jwtService = require("../lib/jwt");

// Only super_admin can create admins
router.post("/create-admin", authWithRole, authWithRole.withRole, permit("super_admin"), async (req, res, next) => {
  try {
    const { email, password, first_name, last_name } = req.body;

    // Validate required fields
    if (!email || !password || !first_name || !last_name) {
      throw new ClientError("email, password, first_name, last_name required", 400);
    }

    // Check if user already exists
    const exists = await UserModel.findOne({ email });
    if (exists) {
      throw new ClientError("User already exists", 409);
    }

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    // Create admin user
    const admin = await UserModel.create({
      first_name: String(first_name).trim(),
      last_name: String(last_name).trim(),
      email: String(email).toLowerCase().trim(),
      password: hash,
      role: "admin",
    });

    const accessToken = jwtService.createToken({ user_id: admin._id });

    return res.status(201).json({
      message: "Admin created successfully",
      status: 201,
      accessToken,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
