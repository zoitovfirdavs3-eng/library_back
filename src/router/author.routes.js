const { Router } = require("express");
const router = Router();

const authorController = require("../controllers/author.controller");
const auth = require("../utils/auth.middleware");
const admin = require("../utils/admin.middleware");
const { uploadAuthorPhoto } = require("../utils/upload");

// public
router.get("/", authorController.GET_ALL);
router.get("/:id", authorController.GET_ONE);

// upload (admin only)
router.post("/:id/photo", auth, admin, uploadAuthorPhoto.single("photo"), authorController.UPLOAD_PHOTO);

// protected CRUD (admin only)
router.post("/", auth, admin, authorController.CREATE);
router.patch("/:id", auth, admin, authorController.UPDATE);
router.delete("/:id", auth, admin, authorController.DELETE);

module.exports = router;
