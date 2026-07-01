import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    type: { type: String, enum: ["mcq", "coding"], required: true },
    selectedOptionIndex: Number,
    language: String,
    code: String,
    output: String,
    testResults: [
      {
        input: String,
        expectedOutput: String,
        actualOutput: String,
        passed: Boolean,
        error: String
      }
    ],
    marksAwarded: { type: Number, default: 0 }
  },
  { _id: false }
);

const attemptSchema = new mongoose.Schema(
  {
    contest: { type: mongoose.Schema.Types.ObjectId, ref: "Contest", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    startedAt: { type: Date, default: Date.now },
    submittedAt: Date,
    score: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },
    answers: [answerSchema]
  },
  { timestamps: true }
);

attemptSchema.index({ contest: 1, student: 1 }, { unique: true });

export default mongoose.model("Attempt", attemptSchema);
