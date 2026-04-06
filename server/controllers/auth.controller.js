const Student = require("../models/Student.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
    const { name, email, password, role } = req.body;
    console.log("Registration attempt for:", email);
    try {
        if (!name || !email || !password) {
            return res.status(400).json({ msg: "Please enter all fields" });
        }

        let student = await Student.findOne({ email });
        console.log("Check existing user result:", student ? "Found" : "Not Found");
        if (student) return res.status(400).json({ msg: "User already exists" });

        student = new Student({ name, email, password, role });
        const salt = await bcrypt.genSalt(10);
        student.password = await bcrypt.hash(password, salt);

        console.log("Saving student to database...");
        await student.save();
        console.log("Student saved successfully");

        const payload = { user: { id: student.id, role: student.role } };

        if (!process.env.JWT_SECRET) {
            console.error("FATAL: JWT_SECRET is not defined in .env");
            return res.status(500).json({ msg: "Server configuration error" });
        }

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 3600 }, (err, token) => {
            if (err) {
                console.error("JWT Sign Error:", err);
                return res.status(500).json({ msg: "Error generating token" });
            }
            console.log("Registration successful, token generated");
            res.json({ token });
        });
    } catch (err) {
        console.error("Full Register Error Object:", err);
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        let student = await Student.findOne({ email });
        if (!student) return res.status(400).json({ msg: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, student.password);
        if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

        const payload = { user: { id: student.id, role: student.role } };

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ msg: "Server configuration error" });
        }

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 3600 }, (err, token) => {
            if (err) {
                console.error("Login JWT Error:", err);
                return res.status(500).json({ msg: "Error generating token" });
            }
            res.json({ token, user: { id: student.id, name: student.name, email: student.email, role: student.role } });
        });
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).send("Server error");
    }
};
