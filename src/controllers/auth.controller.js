const bcrypt = require("bcrypt");
const { ClientError } = require("shokhijakhon-error-handler");

const UserModel = require("../models/User.model");
const jwtService = require("../lib/jwt");
const { generateOTP, hashOTP, sendOTPEmail, verifyOTP } = require("../lib/email");

module.exports = {
  async REGISTER(req, res, next) {
    try {
      let { first_name, last_name, email, phone, password } = req.body;

      // Handle empty phone string as undefined
      if (phone === "") {
        delete req.body.phone;
        phone = undefined;
      }

      // Validate required fields
      if (!first_name || !last_name || !email || !password) {
        throw new ClientError("first_name, last_name, email, password required", 400);
      }

      // Validate and normalize email
      email = String(email).toLowerCase().trim();
      if (email.length === 0) {
        throw new ClientError("email cannot be empty", 400);
      }

      // Validate password
      if (String(password).length === 0) {
        throw new ClientError("password cannot be empty", 400);
      }

      console.log(`REGISTER START: ${email}`);

      // Check if user exists
      const existingUser = await UserModel.findOne({ email });
      
      // Case C: Email found AND is_verified === true
      if (existingUser && existingUser.is_verified) {
        return res.status(409).json({
          "status": 409,
          "message": "Email already registered"
        });
      }

      // Generate 6-digit OTP
      console.log("OTP GENERATED");
      const otp = generateOTP();
      const otpHash = await hashOTP(otp);
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Case B: Email found AND is_verified === false (resend OTP)
      if (existingUser && !existingUser.is_verified) {
        console.log(`USER EXISTS: verified=false`);
        console.log(`RESEND OTP: ${email}`);
        
        // Update existing user with new OTP
        await UserModel.findByIdAndUpdate(existingUser._id, {
          otp_hash: otpHash,
          otp_expires: otpExpires,
          otp_attempts: 0,
          otp_last_sent_at: new Date(),
        });

        // Send OTP email
        console.log("📧 OTP send attempt -> to:" + email + " from:" + (process.env.MAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER));
        const emailResult = await sendOTPEmail(email, otp);
        if (!emailResult.success) {
          return res.status(500).json({
            "status": 500,
            "message": "Failed to send verification email"
          });
        }

        console.log("RESPONSE SENT");
        console.log("REGISTER RESPONSE: OTP ONLY (NO TOKEN)");
        return res.status(200).json({
          "status": 200,
          "message": "Verification code sent",
          "email": email,
          "next": "/verify-email"
        });
      }

      // Case A: Email not found (create new user)
      console.log(`USER NOT FOUND: creating new user`);
      
      const hash = await bcrypt.hash(password, 10);

      // Send OTP email FIRST - if this fails, don't create user
      console.log("📧 OTP send attempt -> to:" + email + " from:" + (process.env.MAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER));
      const emailResult = await sendOTPEmail(email, otp);
      if (!emailResult.success) {
        return res.status(500).json({
          "status": 500,
          "message": "Failed to send verification email"
        });
      }

      // Only create user if email was sent successfully
      const user = await UserModel.create({
        first_name: String(first_name).trim(),
        last_name: String(last_name).trim(),
        email,
        phone: phone ? String(phone).trim() : null,
        password: hash,
        role: "user", // Force role to user to prevent privilege escalation
        is_verified: false,
        otp_hash: otpHash,
        otp_expires: otpExpires,
        otp_attempts: 0,
        otp_last_sent_at: new Date(),
      });

      console.log("RESPONSE SENT");
      console.log("REGISTER RESPONSE: OTP ONLY, NO TOKEN");
      console.log("REGISTER OK: OTP ONLY (NO TOKEN) ->", email);
      return res.status(200).json({
        "status": 200,
        "message": "Verification code sent",
        "email": email,
        "next": "/verify-email"
      });
    } catch (err) {
      next(err);
    }
  },

  async LOGIN(req, res, next) {
    try {
      let { email, password } = req.body;

      // Validate required fields
      if (!email || !password) {
        throw new ClientError("email and password required", 400);
      }

      // Validate and normalize email
      email = String(email).toLowerCase().trim();
      if (email.length === 0) {
        throw new ClientError("email cannot be empty", 400);
      }

      const user = await UserModel.findOne({ email });
      if (!user) {
        throw new ClientError("Email or password wrong", 401);
      }

      const ok = await bcrypt.compare(password, user.password);
      if (!ok) {
        throw new ClientError("Email or password wrong", 401);
      }

      // Check if email is verified
      if (!user.is_verified) {
        console.log("LOGIN BLOCKED: NOT VERIFIED");
        console.log("LOGIN BLOCKED: NOT VERIFIED ->", email);
        return res.status(403).json({
          "status": 403,
          "message": "Email not verified",
          "email": email,
          "next": "/verify-email"
        });
      }

      const accessToken = jwtService.createToken({ user_id: user._id });

      console.log("LOGIN OK: VERIFIED");
      console.log("LOGIN OK: VERIFIED ->", email);
      return res.status(200).json({
        message: "Login success",
        status: 200,
        accessToken,
      });
    } catch (err) {
      return next(err);
    }
  },

  async VERIFY_EMAIL(req, res, next) {
    try {
      const { email, otp } = req.body;

      // Validate required fields
      if (!email || !otp) {
        throw new ClientError("email and otp required", 400);
      }

      // Validate code format (6 digits)
      if (!/^\d{6}$/.test(otp)) {
        throw new ClientError("Invalid code format. Must be 6 digits", 400);
      }

      // Normalize email
      email = String(email).toLowerCase().trim();

      // Find user
      const user = await UserModel.findOne({ email });
      if (!user) {
        throw new ClientError("User not found", 404);
      }

      // Check if already verified
      if (user.is_verified) {
        return res.status(200).json({
          "status": 200,
          "message": "Already verified"
        });
      }

      // Check if OTP exists
      if (!user.otp_hash || !user.otp_expires) {
        throw new ClientError("No verification code found", 400);
      }

      // Check expiry
      if (new Date() > user.otp_expires) {
        throw new ClientError("OTP expired", 400);
      }

      // Check OTP attempts
      if (user.otp_attempts >= 5) {
        throw new ClientError("Too many attempts", 429);
      }

      // Verify OTP
      const isValidOTP = await verifyOTP(otp, user.otp_hash);
      if (!isValidOTP) {
        // Increment attempts
        await UserModel.findByIdAndUpdate(user._id, {
          $inc: { otp_attempts: 1 }
        });
        
        throw new ClientError("OTP incorrect", 400);
      }

      // Verify email and clear OTP fields
      await UserModel.findByIdAndUpdate(user._id, {
        is_verified: true,
        otp_hash: null,
        otp_expires: null,
        otp_attempts: 0,
        otp_last_sent_at: null,
      });

      // Create access token
      const accessToken = jwtService.createToken({ user_id: user._id });

      return res.status(200).json({
        "status": 200,
        "message": "Email verified",
        accessToken,
      });
    } catch (err) {
      return next(err);
    }
  },

  async RESEND_CODE(req, res, next) {
    try {
      const { email } = req.body;

      // Validate required field
      if (!email) {
        throw new ClientError("email required", 400);
      }

      // Normalize email
      email = String(email).toLowerCase().trim();

      // Find user
      const user = await UserModel.findOne({ email });
      if (!user) {
        throw new ClientError("User not found", 404);
      }

      // Check if already verified
      if (user.is_verified) {
        return res.status(200).json({
          "status": 200,
          "message": "Already verified"
        });
      }

      // Cooldown: check if OTP was sent in last 60 seconds
      if (user.otp_last_sent_at) {
        const cooldownEnd = new Date(user.otp_last_sent_at.getTime() + 60 * 1000);
        if (new Date() < cooldownEnd) {
          const remainingSeconds = Math.ceil((cooldownEnd - new Date()) / 1000);
          throw new ClientError(`Please wait ${remainingSeconds} seconds before resending`, 429);
        }
      }

      // Generate new OTP
      const otp = generateOTP();
      const otpHash = await hashOTP(otp);
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Update user with new OTP
      await UserModel.findByIdAndUpdate(user._id, {
        otp_hash: otpHash,
        otp_expires: otpExpires,
        otp_attempts: 0,
        otp_last_sent_at: new Date(),
      });

      // Send OTP email
      console.log("📧 OTP send attempt -> to:" + email + " from:" + (process.env.MAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER));
      const emailResult = await sendOTPEmail(email, otp);
      if (!emailResult.success) {
        throw new ClientError("Failed to send verification email", 500);
      }

      return res.status(200).json({
        "status": 200,
        "message": "Verification code resent",
        "email": email
      });
    } catch (err) {
      return next(err);
    }
  },

  async ME(req, res, next) {
    try {
      const user = await UserModel.findById(req.user_id).select("-password");
      if (!user) throw new ClientError("User not found", 404);

      return res.json({ status: 200, user });
    } catch (err) {
      next(err);
    }
  },
};
