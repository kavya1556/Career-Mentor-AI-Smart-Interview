const mongoose = require("mongoose");

const StudentSchema = new mongoose.Schema({
    studentId: String,
    username: { type: String, unique: true, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String },
    password: { type: String, required: true },
    role: { type: String, enum: ["student", "admin"], default: "student" }
});

module.exports = mongoose.model("Student", StudentSchema);
