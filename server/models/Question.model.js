const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "InterviewSession" },
    text: String,
    difficulty: String,
    type: String, // technical, behavioral
    keywords: [String],
    skills_tested: [String]
});

module.exports = mongoose.model("Question", QuestionSchema);
