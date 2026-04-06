const axios = require("axios");
const RoadMap = require("../models/RoadMap.model");
const Resume = require("../models/Resume.model");
const FLASK_URL = process.env.FLASK_AI_SERVICE;

exports.generateRoadmap = async (req, res) => {
    try {
        const resume = await Resume.findOne({ studentId: req.user.id });
        if (!resume || !resume.missingSkills || resume.missingSkills.length === 0) {
            return res.status(400).json({ error: "Please upload a resume to analyze your skill gaps first." });
        }

        const missing_skills = resume.missingSkills;
        const job_role = resume.targetRole || "Software Engineer";

        // Safety: Delete previous old roadmap generations to avoid cross-contamination
        await RoadMap.deleteMany({ studentId: req.user.id });

        const response = await axios.post(`${FLASK_URL}/generate-roadmap/`, {
            missing_skills,
            job_role
        });

        const topics = missing_skills.map((skill, index) => ({
            title: skill,
            description: `Master ${skill}`,
            week: (index % 4) + 1
        }));

        const roadmap = new RoadMap({
            studentId: req.user.id,
            jobRole: job_role,
            topics: topics,
            content: response.data.roadmap
        });
        await roadmap.save();

        res.json(roadmap);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getRoadmap = async (req, res) => {
    try {
        const roadmap = await RoadMap.findOne({ studentId: req.user.id }).sort({ createdAt: -1 });
        res.json(roadmap);
    } catch (err) {
        res.status(500).send("Server error");
    }
};
