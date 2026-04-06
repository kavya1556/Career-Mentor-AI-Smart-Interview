const express = require("express");
const router = express.Router();
const roadmapController = require("../controllers/roadmap.controller");
const auth = require("../middleware/authMiddleware");

router.post("/generate", auth, roadmapController.generateRoadmap);
router.get("/", auth, roadmapController.getRoadmap);

module.exports = router;
