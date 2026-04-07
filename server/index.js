require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
if (!process.env.MONGO_URI) {
    console.error("FATAL ERROR: MONGO_URI is not defined in .env");
    process.exit(1);
}

console.log("Attempting to connect to MongoDB...");
const redactedUri = process.env.MONGO_URI.replace(/:([^@]+)@/, ":****@");
console.log("URI:", redactedUri);
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch(err => {
        console.error("MongoDB connection error:", err);
        if (err.reason) console.error("Error Reason:", err.reason);
    });

// Routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/resume", require("./routes/resume.routes"));
app.use("/api/roadmap", require("./routes/roadmap.routes"));
app.use("/api/interview", require("./routes/interview.routes"));
app.use("/api/progress", require("./routes/progress.routes"));
app.use("/api/admin", require("./routes/admin.routes"));

// Health check (moved to /api so it doesn't conflict with frontend)
app.get("/api/status", (req, res) => res.json({ status: "SmartAI Backend is Live ✓" }));
app.get("/api/health", (req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

// Serve static assets
const buildPath = path.join(__dirname, "..", "client", "build");
const fs = require("fs");

if (fs.existsSync(buildPath)) {
    console.log("Serving frontend from:", buildPath);
    app.use(express.static(buildPath));
    app.get("*", (req, res) => {
        res.sendFile(path.join(buildPath, "index.html"));
    });
} else {
    console.log("Frontend build not found at:", buildPath);
    // Fallback if frontend is not built yet
    app.get("/", (req, res) => res.json({ status: "Backend Live", message: "Frontend build not found. Run 'npm run build' in the client folder." }));
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Proctoring session active
// Force restart to pick up .env changes
