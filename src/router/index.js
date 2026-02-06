const { Router } = require("express");
const router = Router();

router.use("/auth", require("./auth.routes"));
router.use("/admin", require("./admin.routes"));
router.use("/authors", require("./author.routes"));
router.use("/categories", require("./category.routes"));
router.use("/books", require("./book.routes"));
router.use("/users", require("./user.routes"));

module.exports = router;
