const Student = require("../models/Student.model");

exports.getAllUsers = async (req, res) => {
    try {
        const users = await Student.find().select("-password");
        res.json(users);
    } catch (err) {
        res.status(500).send("Server error");
    }
};

exports.deleteUser = async (req, res) => {
    try {
        await Student.findByIdAndDelete(req.params.id);
        res.json({ msg: "User deleted" });
    } catch (err) {
        res.status(500).send("Server error");
    }
};
