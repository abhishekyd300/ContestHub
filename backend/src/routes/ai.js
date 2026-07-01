import express from "express";
import OpenAI from "openai";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

function sampleQuestions(topic = "data structures") {
  return [
    {
      type: "mcq",
      title: `Core concept in ${topic}`,
      prompt: `Which option best describes an important concept in ${topic}?`,
      marks: 2,
      options: [
        { text: "A reusable approach for solving a class of problems", isCorrect: true },
        { text: "A database migration strategy only", isCorrect: false },
        { text: "A CSS layout technique", isCorrect: false },
        { text: "A deployment pipeline step", isCorrect: false }
      ]
    },
    {
      type: "coding",
      title: `Solve a ${topic} problem`,
      prompt: "Read input, solve the described problem, and print the expected output.",
      marks: 10,
      language: "python",
      starterCode: "import sys\n\ninput_data = sys.stdin.read()\nprint(input_data.strip())\n",
      testCases: [{ input: "hello", expectedOutput: "hello" }]
    }
  ];
}

router.post("/generate-questions", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const { topic, count = 5, difficulty = "medium" } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      return res.json({ questions: sampleQuestions(topic), source: "sample" });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Generate contest questions as JSON with a questions array. Use type mcq or coding. MCQs need exactly 4 options with one correct option. Coding questions must use language python, cpp, or java and need starterCode and testCases."
        },
        {
          role: "user",
          content: `Create ${count} ${difficulty} questions about ${topic}. Return fields: type,title,prompt,marks,options,language,starterCode,testCases.`
        }
      ]
    });

    const parsed = JSON.parse(completion.choices[0].message.content);
    res.json({ questions: parsed.questions || [], source: "openai" });
  } catch (error) {
    next(error);
  }
});

export default router;
