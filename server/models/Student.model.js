const mongoose = require("mongoose");

const StudentSchema = new mongoose.Schema({
    studentId: String,
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["student", "admin"], default: "student" }
});

module.exports = mongoose.model("Student", StudentSchema);
