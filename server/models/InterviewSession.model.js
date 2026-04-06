const mongoose = require("mongoose");

const InterviewSessionSchema = new mongoose.Schema({
    sessionId: String,
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    jobRoleId: { type: mongoose.Schema.Types.ObjectId, ref: "JobRole" },
    date: { type: Date, default: Date.now },
    score: Number
});

module.exports = mongoose.model("InterviewSession", InterviewSessionSchema);
