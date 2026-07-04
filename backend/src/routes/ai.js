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

    // 1. Try Google Gemini if key is provided
    if (process.env.GEMINI_API_KEY) {
      const apiKey = process.env.GEMINI_API_KEY;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Generate contest questions as JSON with a questions array. Use type mcq or coding. MCQs need exactly 4 options with one correct option. Coding questions must use language python, cpp, or java and need starterCode and testCases.
Create ${count} ${difficulty} questions about ${topic}. Return fields: type,title,prompt,marks,options,language,starterCode,testCases.`
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errText}`);
      }

      const data = await response.json();
      const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = JSON.parse(textContent);
      return res.json({ questions: parsed.questions || [], source: "gemini" });
    }

    // 2. Try OpenAI if key is provided
    if (process.env.OPENAI_API_KEY) {
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
      return res.json({ questions: parsed.questions || [], source: "openai" });
    }

    // 3. Fallback to sample static questions
    res.json({ questions: sampleQuestions(topic), source: "sample" });
  } catch (error) {
    next(error);
  }
});

export default router;
