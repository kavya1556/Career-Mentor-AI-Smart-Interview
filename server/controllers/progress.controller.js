const InterviewSession = require("../models/InterviewSession.model");
const Question = require("../models/Question.model");
const Feedback = require("../models/Feedback.model");
const Answer = require("../models/Answer.model");
const mongoose = require("mongoose");

exports.getStudentProgress = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);
        const sessionsRaw = await InterviewSession.find({ studentId: userId }).sort({ date: -1 });

        const sessions = [];
        let totalScoreSum = 0;
        let validSessionCount = 0;

        for (let sessionData of sessionsRaw) {
            let session = sessionData.toObject();
            if (session.score === undefined || session.score === null || session.score === 0) {
                // Attempt to fetch real user submission feedback from DB
                const questions = await Question.find({ sessionId: session._id });
                if (questions && questions.length > 0) {
                    const questionIds = questions.map(q => q._id);
                    const answers = await Answer.find({ questionId: { $in: questionIds }, studentId: userId });
                    if (answers && answers.length > 0) {
                        const answerIds = answers.map(a => a._id);
                        const feedbacks = await Feedback.find({ answerId: { $in: answerIds } });
                        if (feedbacks && feedbacks.length > 0) {
                            const sum = feedbacks.reduce((acc, f) => acc + (f.score || 0), 0);
                            session.score = Math.round(sum / feedbacks.length);
                        }
                    }
                }

                // If no real score exists, assign 0 explicitly to avoid breaking mathematics without fake data
                if (!session.score) {
                    session.score = 0;
                }
            }

            sessions.push(session);
            totalScoreSum += session.score;
            if (session.score > 0) validSessionCount++;
        }

        const averageScore = validSessionCount > 0 ? (totalScoreSum / validSessionCount) : 0;

        // Recent feedback
        const recentSessions = sessions.slice(0, 5);

        // Capability Matrix based on Resume Skills
        let capabilities = [];
        const Resume = require("../models/Resume.model");
        const resume = await Resume.findOne({ studentId: userId });

        if (resume && resume.skills && resume.skills.length > 0) {
            const topSkills = resume.skills.slice(0, 6);

            const answersRaw = await Answer.find({ studentId: userId });
            const answerIds = answersRaw.map(a => a._id);
            const feedbackRaw = await Feedback.find({ answerId: { $in: answerIds } });

            const scoreMap = {};
            for (let fb of feedbackRaw) {
                const ans = answersRaw.find(a => a._id.toString() === fb.answerId.toString());
                if (ans) {
                    if (!scoreMap[ans.questionId]) {
                        scoreMap[ans.questionId] = { total: 0, count: 0 };
                    }
                    scoreMap[ans.questionId].total += (fb.score || 0);
                    scoreMap[ans.questionId].count += 1;
                }
            }

            const questionIds = Object.keys(scoreMap);
            const questionsObj = await Question.find({ _id: { $in: questionIds } });

            capabilities = topSkills.map((skill) => {
                let skillScoreTotal = 0;
                let skillQuestionCount = 0;
                const skillLower = skill.toLowerCase();

                for (let q of questionsObj) {
                    const hasSkill = (q.skills_tested && q.skills_tested.some(s => s.toLowerCase().includes(skillLower))) ||
                        (q.text && q.text.toLowerCase().includes(skillLower)) ||
                        (q.keywords && q.keywords.some(k => k.toLowerCase().includes(skillLower)));

                    if (hasSkill) {
                        const scoreData = scoreMap[q._id.toString()];
                        if (scoreData && scoreData.count > 0) {
                            skillScoreTotal += (scoreData.total / scoreData.count);
                            skillQuestionCount++;
                        }
                    }
                }

                const finalValue = skillQuestionCount > 0 ? Math.round(skillScoreTotal / skillQuestionCount) : 0;
                return { name: skill, value: finalValue };
            });
        }


        res.json({
            sessions,
            averageScore: Math.round(averageScore * 10) / 10,
            recentSessions,
            capabilities
        });
    } catch (err) {
        console.error("Get Progress Error:", err);
        res.status(500).send("Server error");
    }
};

exports.getSessionDetails = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.id;

        const session = await InterviewSession.findById(sessionId);
        if (!session) return res.status(404).json({ msg: "Session not found" });

        const questions = await Question.find({ sessionId });
        const transcript = [];

        for (const q of questions) {
            const answer = await Answer.findOne({ questionId: q._id, studentId: userId });
            let feedback = null;
            if (answer) {
                feedback = await Feedback.findOne({ answerId: answer._id });
            }
            transcript.push({
                question: q.text,
                answer: answer ? answer.answerText : "No response provided",
                score: feedback ? feedback.score : 0,
                comments: feedback ? feedback.comments : "No feedback available",
                breakdown: feedback ? feedback.breakdown : null
            });
        }

        res.json({
            id: session._id,
            date: session.date,
            transcript
        });
    } catch (err) {
        console.error("Get Session Details Error:", err);
        res.status(500).send("Server error");
    }
};
