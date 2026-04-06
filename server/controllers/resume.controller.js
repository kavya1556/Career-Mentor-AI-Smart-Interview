const axios = require("axios");
const Resume = require("../models/Resume.model");
const RoadMap = require("../models/RoadMap.model");
const path = require("path");
const fs = require("fs");
const FLASK_URL = process.env.FLASK_AI_SERVICE;

exports.parseResume = async (req, res) => {
    try {
        const { job_role } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: "No resume file uploaded" });
        }

        const file_path = path.resolve(req.file.path);
        const file_base64 = fs.readFileSync(file_path, { encoding: 'base64' });

        const response = await axios.post(`${FLASK_URL}/parse-resume/`, {
            file_path,
            file_base64,
            filename: req.file.originalname,
            job_role
        });
        
        // Clean up the temporary uploaded file
        try { fs.unlinkSync(file_path); } catch(e) {}


        const data = response.data;

        let resume = await Resume.findOne({ studentId: req.user.id });
        if (resume) {
            resume.skills = data.skills;
            resume.education = data.education;
            resume.experience = data.experience;
            resume.targetRole = job_role;
            resume.missingSkills = data.gap_analysis ? data.gap_analysis.missing_skills : [];
            await resume.save();
        } else {
            resume = new Resume({
                studentId: req.user.id,
                filepath: file_path,
                skills: data.skills,
                education: data.education,
                experience: data.experience,
                targetRole: job_role,
                missingSkills: data.gap_analysis ? data.gap_analysis.missing_skills : []
            });
            await resume.save();
        }

        // IMPORTANT: Clear old roadmap so the user is forced to generate a new Detailed Roadmap for the new role/resume
        await RoadMap.deleteMany({ studentId: req.user.id });

        res.json({ resume, gap_analysis: data.gap_analysis });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};
