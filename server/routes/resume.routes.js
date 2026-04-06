const express = require("express");
const router = express.Router();
const resumeController = require("../controllers/resume.controller");
const auth = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname))
    }
});

const upload = multer({ storage: storage });

router.post("/upload", auth, upload.single("resume"), resumeController.parseResume);

module.exports = router;
