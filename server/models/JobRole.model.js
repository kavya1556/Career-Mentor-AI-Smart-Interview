const mongoose = require("mongoose");

const JobRoleSchema = new mongoose.Schema({
    roleId: String,
    name: String,
    requiredSkills: [String]
});

module.exports = mongoose.model("JobRole", JobRoleSchema);
