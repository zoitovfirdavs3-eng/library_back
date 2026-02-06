const { Router } = require("express");
const router = Router();

const authController = require("../controllers/auth.controller");
const auth = require("../utils/auth.middleware");

router.post("/register", authController.REGISTER);
router.post("/login", authController.LOGIN);
router.post("/verify-email", authController.VERIFY_EMAIL);
router.post("/resend-code", authController.RESEND_CODE);
router.get("/me", auth, authController.ME);

module.exports = router;
