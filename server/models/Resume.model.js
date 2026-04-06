const mongoose = require("mongoose");

const ResumeSchema = new mongoose.Schema({
    resumeId: String,
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    filepath: String,
    skills: [String],
    education: [String],
    experience: [String],
    targetRole: String,
    missingSkills: [String]
});

module.exports = mongoose.model("Resume", ResumeSchema);
