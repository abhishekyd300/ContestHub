import express from "express";
import Contest from "../models/Contest.js";
import Attempt from "../models/Attempt.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { getSupportedLanguages, runCodeForQuestion } from "../utils/codeRunner.js";
import { contestForStudent } from "../utils/sanitize.js";
import { scoreAttempt } from "../utils/scoring.js";

const router = express.Router();

function canStart(contest) {
  const now = new Date();
  return contest.isPublished && now >= contest.startAt && now <= contest.endAt;
}

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const query = req.user.role === "admin" ? { createdBy: req.user._id } : { isPublished: true };
    const contests = await Contest.find(query).sort({ startAt: 1 });
    res.json({
      contests: req.user.role === "student" ? contests.map((contest) => contestForStudent(contest)) : contests
    });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const contest = await Contest.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ contest });
  } catch (error) {
    next(error);
  }
});

router.get("/meta/languages", requireAuth, (req, res) => {
  res.json({ languages: getSupportedLanguages() });
});

router.get("/:contestId", requireAuth, async (req, res, next) => {
  try {
    const contest = await Contest.findById(req.params.contestId);
    if (!contest) return res.status(404).json({ message: "Contest not found" });

    if (req.user.role === "student" && !contest.isPublished) {
      return res.status(404).json({ message: "Contest not found" });
    }

    res.json({ contest: req.user.role === "student" ? contestForStudent(contest) : contest });
  } catch (error) {
    next(error);
  }
});

router.patch("/:contestId", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const contest = await Contest.findOneAndUpdate(
      { _id: req.params.contestId, createdBy: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!contest) return res.status(404).json({ message: "Contest not found" });
    res.json({ contest });
  } catch (error) {
    next(error);
  }
});

router.post("/:contestId/start", requireAuth, requireRole("student"), async (req, res, next) => {
  try {
    const contest = await Contest.findById(req.params.contestId);
    if (!contest) return res.status(404).json({ message: "Contest not found" });
    if (!canStart(contest)) {
      return res.status(400).json({ message: "Contest is not currently available" });
    }

    const attempt = await Attempt.findOneAndUpdate(
      { contest: contest._id, student: req.user._id },
      {
        $setOnInsert: {
          contest: contest._id,
          student: req.user._id,
          totalMarks: contest.questions.reduce((sum, question) => sum + question.marks, 0)
        }
      },
      { new: true, upsert: true }
    );

    res.json({ attempt, contest: contestForStudent(contest) });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/:contestId/questions/:questionId/run",
  requireAuth,
  requireRole("student"),
  async (req, res, next) => {
    try {
      const contest = await Contest.findById(req.params.contestId);
      if (!contest) return res.status(404).json({ message: "Contest not found" });
      if (!canStart(contest)) {
        return res.status(400).json({ message: "Contest is not currently available" });
      }

      const question = contest.questions.id(req.params.questionId);
      if (!question || question.type !== "coding") {
        return res.status(404).json({ message: "Coding question not found" });
      }

      const execution = await runCodeForQuestion({
        code: req.body.code,
        language: req.body.language || question.language || "python",
        testCases: question.testCases
      });

      res.json(execution);
    } catch (error) {
      next(error);
    }
  }
);

router.post("/:contestId/submit", requireAuth, requireRole("student"), async (req, res, next) => {
  try {
    const contest = await Contest.findById(req.params.contestId);
    if (!contest) return res.status(404).json({ message: "Contest not found" });

    const attempt = await Attempt.findOne({ contest: contest._id, student: req.user._id });
    if (!attempt) return res.status(400).json({ message: "Start the contest before submitting" });
    if (attempt.submittedAt) return res.status(400).json({ message: "Contest already submitted" });

    const { score, totalMarks, answers } = await scoreAttempt(contest, req.body.answers || []);
    attempt.score = score;
    attempt.totalMarks = totalMarks;
    attempt.answers = answers;
    attempt.submittedAt = new Date();
    await attempt.save();

    const payload = attempt.toObject();
    payload.contest = { _id: attempt.contest._id, title: attempt.contest.title };
    res.json({ attempt: payload });
  } catch (error) {
    next(error);
  }
});

router.get("/:contestId/results/me", requireAuth, requireRole("student"), async (req, res, next) => {
  try {
    const attempt = await Attempt.findOne({
      contest: req.params.contestId,
      student: req.user._id
    }).populate("contest");

    if (!attempt || !attempt.submittedAt) {
      return res.status(404).json({ message: "No submitted attempt found" });
    }

    res.json({ attempt });
  } catch (error) {
    next(error);
  }
});

router.get("/:contestId/leaderboard", requireAuth, async (req, res, next) => {
  try {
    const attempts = await Attempt.find({
      contest: req.params.contestId,
      submittedAt: { $exists: true }
    })
      .populate("student", "name email rollNumber")
      .sort({ score: -1, submittedAt: 1 });

    res.json({ leaderboard: attempts });
  } catch (error) {
    next(error);
  }
});

router.get("/:contestId/admin-results", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const contest = await Contest.findOne({ _id: req.params.contestId, createdBy: req.user._id });
    if (!contest) return res.status(404).json({ message: "Contest not found" });

    const attempts = await Attempt.find({ contest: contest._id })
      .populate("student", "name email rollNumber")
      .sort({ score: -1, submittedAt: 1 });

    res.json({ contest, attempts });
  } catch (error) {
    next(error);
  }
});

export default router;
