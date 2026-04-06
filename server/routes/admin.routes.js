const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");

router.get("/users", [auth, admin], adminController.getAllUsers);
router.delete("/users/:id", [auth, admin], adminController.deleteUser);

module.exports = router;
