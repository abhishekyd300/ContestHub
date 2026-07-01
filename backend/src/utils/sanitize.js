export function contestForStudent(contest) {
  const plain = contest.toObject ? contest.toObject() : contest;

  return {
    ...plain,
    questions: plain.questions.map((question) => ({
      ...question,
      options: question.options?.map((option) => ({ text: option.text })) || [],
      testCases: question.testCases?.map((testCase) => ({ input: testCase.input })) || []
    }))
  };
}
