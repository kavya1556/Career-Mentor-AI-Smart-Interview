const axios = require("axios");
const InterviewSession = require("../models/InterviewSession.model");
const Question = require("../models/Question.model");
const Answer = require("../models/Answer.model");
const Feedback = require("../models/Feedback.model");
const Resume = require("../models/Resume.model");
const FLASK_URL = process.env.FLASK_AI_SERVICE;

exports.startInterview = async (req, res) => {
    try {
        const resume = await Resume.findOne({ studentId: req.user.id });
        if (!resume || !resume.skills || resume.skills.length === 0) {
            return res.status(400).json({ error: "Please upload your resume to generate a relevant mock interview first." });
        }

        const job_role = resume.targetRole || "Software Engineer";
        const skills = resume.skills;

        const session = new InterviewSession({
            studentId: req.user.id,
        });
        await session.save();

        const response = await axios.post(`${FLASK_URL}/generate-questions/`, {
            job_role,
            skills
        });

        const questionsData = response.data.questions;
        const questions = await Promise.all(questionsData.map(async (q) => {
            const question = new Question({
                sessionId: session.id,
                text: q.Text || q.text,
                difficulty: q.Difficulty || q.difficulty,
                type: q.Type || q.type,
                keywords: q.ExpectedKeywords || q.keywords,
                skills_tested: q.SkillsTested || q.skills_tested || []
            });
            return await question.save();
        }));

        res.json({ session, questions });
    } catch (err) {
        console.error("Start Interview Error:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.submitAnswer = async (req, res) => {
    try {
        const { question_id, answer_text } = req.body;

        const question = await Question.findById(question_id);
        if (!question) return res.status(404).json({ msg: "Question not found" });

        const answer = new Answer({
            questionId: question_id,
            studentId: req.user.id,
            answerText: answer_text
        });
        await answer.save();

        const response = await axios.post(`${FLASK_URL}/evaluate-answers/`, {
            question: question.text,
            answer: answer_text,
            expected_keywords: question.keywords
        });

        const feedback = new Feedback({
            answerId: answer.id,
            score: response.data.Score || response.data.score,
            comments: response.data.Comments || response.data.comments,
            breakdown: response.data.Breakdown || response.data.breakdown
        });
        await feedback.save();

        res.json({ answer, feedback });
    } catch (err) {
        console.error("Submit Answer Error:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.generateVoice = async (req, res) => {
    try {
        const { text } = req.body;
        const response = await axios.post(`${FLASK_URL}/generate-voice/`, { text });
        res.json(response.data);
    } catch (err) {
        console.error("Generate Voice Error:", err);
        res.status(500).json({ error: err.message });
    }
};
