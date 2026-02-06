const { Router } = require("express");
const router = Router();

const categoryController = require("../controllers/category.controller");
const auth = require("../utils/auth.middleware");
const admin = require("../utils/admin.middleware");

// public
router.get("/", categoryController.GET_ALL);
router.get("/:id", categoryController.GET_ONE);

// protected (admin only)
router.post("/", auth, admin, categoryController.CREATE);
router.patch("/:id", auth, admin, categoryController.UPDATE);
router.delete("/:id", auth, admin, categoryController.DELETE);

module.exports = router;
