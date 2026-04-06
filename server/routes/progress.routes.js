const express = require("express");
const router = express.Router();
const progressController = require("../controllers/progress.controller");
const auth = require("../middleware/authMiddleware");

router.get("/", auth, progressController.getStudentProgress);
router.get("/session/:sessionId", auth, progressController.getSessionDetails);

module.exports = router;
