const mongoose = require("mongoose");

const FeedbackSchema = new mongoose.Schema({
    answerId: { type: mongoose.Schema.Types.ObjectId, ref: "Answer" },
    score: Number,
    comments: String,
    breakdown: {
        relevance: Number,
        completeness: Number,
        grammar: Number,
        coherence: Number
    }
});

module.exports = mongoose.model("Feedback", FeedbackSchema);
