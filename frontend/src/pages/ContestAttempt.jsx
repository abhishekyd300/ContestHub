import { CheckCircle2, Loader2, PlayCircle, Send, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/client";

const languageOptions = [
  { value: "python", label: "Python" },
  { value: "cpp", label: "C++" },
  { value: "java", label: "Java" }
];

const starterTemplates = {
  python: "import sys\n\n# Read input from stdin\ninput_data = sys.stdin.read()\n\n# Write your solution here\nprint(input_data.strip())\n",
  cpp:
    "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n\n    // Write your solution here\n    string input;\n    getline(cin, input, '\\0');\n    cout << input;\n    return 0;\n}\n",
  java:
    "import java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder input = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) {\n            input.append(line).append('\\n');\n        }\n\n        // Write your solution here\n        System.out.print(input.toString().trim());\n    }\n}\n"
};

function starterFor(question, language) {
  return question.starterCode || starterTemplates[language] || starterTemplates.python;
}

export default function ContestAttempt() {
  const { contestId } = useParams();
  const navigate = useNavigate();
  const [contest, setContest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [runResults, setRunResults] = useState({});
  const [runningQuestionId, setRunningQuestionId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .post(`/contests/${contestId}/start`)
      .then(({ data }) => setContest(data.contest))
      .catch((err) => setError(err.response?.data?.message || "Unable to start contest"));
  }, [contestId]);

  const remainingLabel = useMemo(() => {
    if (!contest) return "";
    const end = new Date(contest.endAt).getTime();
    const diff = Math.max(0, end - Date.now());
    const minutes = Math.floor(diff / 60000);
    return `${minutes} min remaining`;
  }, [contest]);

  function updateAnswer(question, value) {
    setAnswers((current) => ({
      ...current,
      [question._id]: { questionId: question._id, type: question.type, ...current[question._id], ...value }
    }));
  }

  function codingAnswer(question) {
    const current = answers[question._id] || {};
    const language = current.language || question.language || "python";
    return {
      questionId: question._id,
      type: question.type,
      language,
      code: current.code ?? starterFor(question, language)
    };
  }

  function changeLanguage(question, language) {
    const current = codingAnswer(question);
    const knownStarters = Object.values(starterTemplates);
    const shouldReplaceCode =
      !current.code || current.code === question.starterCode || knownStarters.includes(current.code);

    updateAnswer(question, {
      language,
      code: shouldReplaceCode ? starterFor(question, language) : current.code
    });
    setRunResults((currentResults) => ({ ...currentResults, [question._id]: null }));
  }

  function buildSubmittedAnswers() {
    return contest.questions.map((question) => {
      if (question.type === "coding") return codingAnswer(question);
      return answers[question._id] || { questionId: question._id, type: question.type };
    });
  }

  async function runCode(question) {
    const answer = codingAnswer(question);
    setError("");
    setRunningQuestionId(question._id);
    setRunResults((current) => ({ ...current, [question._id]: null }));

    try {
      const { data } = await api.post(`/contests/${contestId}/questions/${question._id}/run`, {
        language: answer.language,
        code: answer.code
      });
      setRunResults((current) => ({ ...current, [question._id]: data }));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to run code");
    } finally {
      setRunningQuestionId("");
    }
  }

  async function submit() {
    setError("");
    try {
      await api.post(`/contests/${contestId}/submit`, { answers: buildSubmittedAnswers() });
      navigate(`/student/contests/${contestId}/result`);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to submit contest");
    }
  }

  if (error && !contest) return <p className="error">{error}</p>;
  if (!contest) return <div className="screen-message">Preparing contest...</div>;

  return (
    <section className="stack">
      <div className="page-heading">
        <div>
          <p className="eyebrow">{remainingLabel}</p>
          <h1>{contest.title}</h1>
        </div>
        <button className="button" onClick={submit}>
          <Send size={18} />
          Submit
        </button>
      </div>
      {contest.questions.map((question, index) => (
        <article className="question-editor" key={question._id}>
          <div className="section-title">
            <h2>
              {index + 1}. {question.title}
            </h2>
            <span className="marks">{question.marks} marks</span>
          </div>
          <p>{question.prompt}</p>
          {question.type === "mcq" ? (
            <div className="options-grid">
              {question.options.map((option, optionIndex) => (
                <label className="option-row" key={optionIndex}>
                  <input
                    type="radio"
                    name={question._id}
                    onChange={() => updateAnswer(question, { selectedOptionIndex: optionIndex })}
                  />
                  <span>{option.text}</span>
                </label>
              ))}
            </div>
          ) : (
            <CodingQuestion
              answer={codingAnswer(question)}
              isRunning={runningQuestionId === question._id}
              question={question}
              result={runResults[question._id]}
              onChangeCode={(code) => updateAnswer(question, { ...codingAnswer(question), code })}
              onChangeLanguage={(language) => changeLanguage(question, language)}
              onRun={() => runCode(question)}
            />
          )}
        </article>
      ))}
      {error && <p className="error">{error}</p>}
      <button className="button wide" onClick={submit}>
        <Send size={18} />
        Submit contest
      </button>
    </section>
  );
}

function CodingQuestion({ answer, isRunning, onChangeCode, onChangeLanguage, onRun, question, result }) {
  return (
    <div className="coding-workspace">
      <div className="editor-toolbar">
        <label>
          Language
          <select value={answer.language} onChange={(event) => onChangeLanguage(event.target.value)}>
            {languageOptions.map((language) => (
              <option key={language.value} value={language.value}>
                {language.label}
              </option>
            ))}
          </select>
        </label>
        <button className="button" type="button" onClick={onRun} disabled={isRunning}>
          {isRunning ? <Loader2 className="spin" size={18} /> : <PlayCircle size={18} />}
          Run tests
        </button>
      </div>
      <label>
        Code editor
        <textarea className="code-area code-editor" value={answer.code} onChange={(event) => onChangeCode(event.target.value)} />
      </label>
      <div className="test-case-list">
        {(question.testCases || []).map((testCase, index) => {
          const caseResult = result?.results?.[index];
          return (
            <div className={`test-case-result ${caseResult?.passed ? "passed" : caseResult ? "failed" : ""}`} key={index}>
              <div className="section-title">
                <strong>Test case {index + 1}</strong>
                {caseResult ? (
                  <span className="result-pill">
                    {caseResult.passed ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                    {caseResult.passed ? "Passed" : "Failed"}
                  </span>
                ) : (
                  <span className="muted">Not run</span>
                )}
              </div>
              <div className="two-column">
                <div className="sample-box">
                  <strong>Input</strong>
                  <pre>{testCase.input || "No input"}</pre>
                </div>
                <div className="sample-box">
                  <strong>Your output</strong>
                  <pre>{caseResult?.actualOutput || "-"}</pre>
                </div>
              </div>
              {caseResult?.error && <pre className="run-error">{caseResult.error}</pre>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
