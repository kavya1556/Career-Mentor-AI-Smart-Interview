const mongoose = require("mongoose");

const RoadMapSchema = new mongoose.Schema({
    roadMapId: String,
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    jobRole: String,
    content: String,
    topics: [{
        title: String,
        description: String,
        week: Number
    }]
}, { timestamps: true });

module.exports = mongoose.model("RoadMap", RoadMapSchema);
