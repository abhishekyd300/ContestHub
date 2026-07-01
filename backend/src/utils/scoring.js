import { runCodeForQuestion } from "./codeRunner.js";

export async function scoreAttempt(contest, submittedAnswers) {
  const answerByQuestionId = new Map(
    submittedAnswers.map((answer) => [String(answer.questionId), answer])
  );

  let score = 0;
  const totalMarks = contest.questions.reduce((sum, question) => sum + question.marks, 0);
  const answers = [];

  for (const question of contest.questions) {
    const submitted = answerByQuestionId.get(String(question._id)) || {};
    let marksAwarded = 0;
    let testResults = [];
    let language = submitted.language;

    if (question.type === "mcq") {
      const correctIndex = question.options.findIndex((option) => option.isCorrect);
      if (Number(submitted.selectedOptionIndex) === correctIndex) {
        marksAwarded = question.marks;
      }
    }

    if (question.type === "coding") {
      language = submitted.language || question.language || "python";
      const execution = await runCodeForQuestion({
        code: submitted.code || "",
        language,
        testCases: question.testCases
      });
      testResults = execution.results;
      if (execution.allPassed) {
        marksAwarded = question.marks;
      }
    }

    score += marksAwarded;

    answers.push({
      questionId: question._id,
      type: question.type,
      selectedOptionIndex: submitted.selectedOptionIndex,
      language,
      code: submitted.code,
      output: submitted.output,
      testResults,
      marksAwarded
    });
  }

  return { score, totalMarks, answers };
}
