import mongoose from "mongoose";

const optionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    isCorrect: { type: Boolean, default: false }
  },
  { _id: false }
);

const testCaseSchema = new mongoose.Schema(
  {
    input: { type: String, default: "" },
    expectedOutput: { type: String, required: true }
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["mcq", "coding"], required: true },
    title: { type: String, required: true },
    prompt: { type: String, required: true },
    marks: { type: Number, required: true, min: 1 },
    options: [optionSchema],
    language: { type: String, default: "python" },
    starterCode: { type: String, default: "" },
    starterCodes: {
      type: Map,
      of: String,
      default: {}
    },
    testCases: [testCaseSchema]
  },
  { timestamps: true }
);

const contestSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    durationMinutes: { type: Number, required: true, min: 1 },
    isPublished: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    questions: [questionSchema]
  },
  { timestamps: true }
);

contestSchema.virtual("status").get(function status() {
  const now = new Date();
  if (!this.isPublished) return "draft";
  if (now < this.startAt) return "scheduled";
  if (now > this.endAt) return "completed";
  return "live";
});

contestSchema.set("toJSON", { virtuals: true });
contestSchema.set("toObject", { virtuals: true });

export default mongoose.model("Contest", contestSchema);
