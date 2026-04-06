const express = require("express");
const router = express.Router();
const interviewController = require("../controllers/interview.controller");
const auth = require("../middleware/authMiddleware");

router.post("/start", auth, interviewController.startInterview);
router.post("/submit", auth, interviewController.submitAnswer);
router.post("/voice", auth, interviewController.generateVoice);

module.exports = router;
