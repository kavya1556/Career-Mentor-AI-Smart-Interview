const mongoose = require("mongoose");

const AnswerSchema = new mongoose.Schema({
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
    answerText: String
});

module.exports = mongoose.model("Answer", AnswerSchema);
