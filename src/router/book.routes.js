const { Router } = require("express");
const router = Router();

const bookController = require("../controllers/book.controller");
const authWithRole = require("../utils/authWithRole.middleware");
const permit = require("../utils/permit.middleware");
const onlyOwner = require("../utils/onlyOwner.middleware");
const { uploadBookCover } = require("../utils/upload");

// Public routes - anyone can read books
router.get("/", bookController.GET_ALL);
router.get("/:id", bookController.GET_ONE);

// Protected routes - admin and super_admin can create books
router.post("/", authWithRole, authWithRole.withRole, permit("admin", "super_admin"), bookController.CREATE);

// Owner routes - book owner can update/delete their own books
router.patch("/:id", authWithRole, authWithRole.withRole, onlyOwner, bookController.UPDATE);
router.delete("/:id", authWithRole, authWithRole.withRole, onlyOwner, bookController.DELETE);

// Cover upload - book owner can upload cover
router.post(
  "/:id/cover",
  authWithRole,
  authWithRole.withRole,
  onlyOwner,
  uploadBookCover.single("cover"),
  bookController.UPLOAD_COVER,
);

module.exports = router;
