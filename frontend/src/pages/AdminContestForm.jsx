import { Bot, Plus, Rocket, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

const blankMcq = {
  type: "mcq",
  title: "",
  prompt: "",
  marks: 2,
  options: [
    { text: "", isCorrect: true },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false }
  ]
};

const blankCoding = {
  type: "coding",
  title: "",
  prompt: "",
  marks: 10,
  language: "python",
  starterCode: "",
  testCases: [{ input: "", expectedOutput: "" }]
};

const languageOptions = [
  { value: "python", label: "Python" },
  { value: "cpp", label: "C++" },
  { value: "java", label: "Java" }
];

export default function AdminContestForm() {
  const navigate = useNavigate();
  const [contest, setContest] = useState({
    title: "",
    description: "",
    startAt: "",
    endAt: "",
    durationMinutes: 60,
    isPublished: true,
    questions: [blankMcq]
  });
  const [ai, setAi] = useState({ topic: "", count: 4, difficulty: "medium" });
  const [error, setError] = useState("");

  function updateContest(field, value) {
    setContest((current) => ({ ...current, [field]: value }));
  }

  function updateQuestion(index, field, value) {
    setContest((current) => {
      const questions = [...current.questions];
      questions[index] = { ...questions[index], [field]: value };
      return { ...current, questions };
    });
  }

  function updateOption(questionIndex, optionIndex, value) {
    setContest((current) => {
      const questions = [...current.questions];
      const options = questions[questionIndex].options.map((option, index) => ({
        ...option,
        text: index === optionIndex ? value : option.text
      }));
      questions[questionIndex] = { ...questions[questionIndex], options };
      return { ...current, questions };
    });
  }

  function markCorrect(questionIndex, optionIndex) {
    setContest((current) => {
      const questions = [...current.questions];
      const options = questions[questionIndex].options.map((option, index) => ({
        ...option,
        isCorrect: index === optionIndex
      }));
      questions[questionIndex] = { ...questions[questionIndex], options };
      return { ...current, questions };
    });
  }

  function updateTestCase(questionIndex, testCaseIndex, field, value) {
    setContest((current) => {
      const questions = [...current.questions];
      const testCases = [...(questions[questionIndex].testCases || [])];
      testCases[testCaseIndex] = { ...testCases[testCaseIndex], [field]: value };
      questions[questionIndex] = {
        ...questions[questionIndex],
        testCases
      };
      return { ...current, questions };
    });
  }

  function addTestCase(questionIndex) {
    setContest((current) => {
      const questions = [...current.questions];
      questions[questionIndex] = {
        ...questions[questionIndex],
        testCases: [...(questions[questionIndex].testCases || []), { input: "", expectedOutput: "" }]
      };
      return { ...current, questions };
    });
  }

  function removeTestCase(questionIndex, testCaseIndex) {
    setContest((current) => {
      const questions = [...current.questions];
      const nextCases = questions[questionIndex].testCases.filter((_, index) => index !== testCaseIndex);
      questions[questionIndex] = {
        ...questions[questionIndex],
        testCases: nextCases.length ? nextCases : [{ input: "", expectedOutput: "" }]
      };
      return { ...current, questions };
    });
  }

  function addQuestion(type) {
    setContest((current) => ({
      ...current,
      questions: [...current.questions, type === "mcq" ? blankMcq : blankCoding]
    }));
  }

  function removeQuestion(index) {
    setContest((current) => ({
      ...current,
      questions: current.questions.filter((_, currentIndex) => currentIndex !== index)
    }));
  }

  async function generateQuestions() {
    setError("");
    try {
      const { data } = await api.post("/ai/generate-questions", ai);
      setContest((current) => ({ ...current, questions: data.questions }));
    } catch (err) {
      setError(err.response?.data?.message || "Could not generate questions");
    }
  }

  async function saveContest(event) {
    event.preventDefault();
    setError("");
    try {
      const payload = {
        ...contest,
        startAt: new Date(contest.startAt).toISOString(),
        endAt: new Date(contest.endAt).toISOString()
      };
      const { data } = await api.post("/contests", payload);
      navigate(`/admin/contests/${data.contest._id}/results`);
    } catch (err) {
      setError(err.response?.data?.message || "Could not save contest");
    }
  }

  return (
    <section className="stack">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Contest setup</p>
          <h1>Create contest</h1>
        </div>
      </div>
      <form className="builder" onSubmit={saveContest}>
        <section className="panel">
          <div className="two-column">
            <label>
              Title
              <input value={contest.title} onChange={(event) => updateContest("title", event.target.value)} required />
            </label>
            <label>
              Duration minutes
              <input
                type="number"
                min="1"
                value={contest.durationMinutes}
                onChange={(event) => updateContest("durationMinutes", Number(event.target.value))}
                required
              />
            </label>
          </div>
          <label>
            Description
            <textarea value={contest.description} onChange={(event) => updateContest("description", event.target.value)} />
          </label>
          <div className="two-column">
            <label>
              Start date and time
              <input
                type="datetime-local"
                value={contest.startAt}
                onChange={(event) => updateContest("startAt", event.target.value)}
                required
              />
            </label>
            <label>
              End date and time
              <input
                type="datetime-local"
                value={contest.endAt}
                onChange={(event) => updateContest("endAt", event.target.value)}
                required
              />
            </label>
          </div>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={contest.isPublished}
              onChange={(event) => updateContest("isPublished", event.target.checked)}
            />
            Publish immediately
          </label>
        </section>

        <section className="panel">
          <div className="section-title">
            <h2>AI question draft</h2>
            <button className="ghost-button" type="button" onClick={generateQuestions}>
              <Bot size={18} />
              Generate
            </button>
          </div>
          <div className="three-column">
            <label>
              Topic
              <input value={ai.topic} onChange={(event) => setAi({ ...ai, topic: event.target.value })} />
            </label>
            <label>
              Count
              <input
                type="number"
                min="1"
                value={ai.count}
                onChange={(event) => setAi({ ...ai, count: Number(event.target.value) })}
              />
            </label>
            <label>
              Difficulty
              <select value={ai.difficulty} onChange={(event) => setAi({ ...ai, difficulty: event.target.value })}>
                <option>easy</option>
                <option>medium</option>
                <option>hard</option>
              </select>
            </label>
          </div>
        </section>

        <section className="stack">
          <div className="section-title">
            <h2>Questions</h2>
            <div className="inline-actions">
              <button className="ghost-button" type="button" onClick={() => addQuestion("mcq")}>
                <Plus size={18} />
                MCQ
              </button>
              <button className="ghost-button" type="button" onClick={() => addQuestion("coding")}>
                <Plus size={18} />
                Coding
              </button>
            </div>
          </div>
          {contest.questions.map((question, index) => (
            <article className="question-editor" key={`${question.type}-${index}`}>
              <div className="section-title">
                <h3>
                  {index + 1}. {question.type.toUpperCase()}
                </h3>
                <button className="icon-button danger" type="button" onClick={() => removeQuestion(index)}>
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="two-column">
                <label>
                  Title
                  <input value={question.title} onChange={(event) => updateQuestion(index, "title", event.target.value)} required />
                </label>
                <label>
                  Marks
                  <input
                    type="number"
                    min="1"
                    value={question.marks}
                    onChange={(event) => updateQuestion(index, "marks", Number(event.target.value))}
                    required
                  />
                </label>
              </div>
              <label>
                Prompt
                <textarea value={question.prompt} onChange={(event) => updateQuestion(index, "prompt", event.target.value)} required />
              </label>

              {question.type === "mcq" ? (
                <div className="options-grid">
                  {question.options.map((option, optionIndex) => (
                    <label className="option-row" key={optionIndex}>
                      <input
                        type="radio"
                        name={`correct-${index}`}
                        checked={option.isCorrect}
                        onChange={() => markCorrect(index, optionIndex)}
                      />
                      <input value={option.text} onChange={(event) => updateOption(index, optionIndex, event.target.value)} required />
                    </label>
                  ))}
                </div>
              ) : (
                <>
                  <label>
                    Default language
                    <select value={question.language || "python"} onChange={(event) => updateQuestion(index, "language", event.target.value)}>
                      {languageOptions.map((language) => (
                        <option key={language.value} value={language.value}>
                          {language.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Starter code
                    <textarea
                      className="code-area"
                      value={question.starterCode}
                      onChange={(event) => updateQuestion(index, "starterCode", event.target.value)}
                    />
                  </label>
                  <div className="section-title">
                    <h4>Test cases</h4>
                    <button className="ghost-button" type="button" onClick={() => addTestCase(index)}>
                      <Plus size={18} />
                      Test case
                    </button>
                  </div>
                  {(question.testCases || []).map((testCase, testCaseIndex) => (
                    <div className="test-case-editor" key={testCaseIndex}>
                      <div className="section-title">
                        <strong>Case {testCaseIndex + 1}</strong>
                        <button
                          className="icon-button danger"
                          type="button"
                          onClick={() => removeTestCase(index, testCaseIndex)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="two-column">
                        <label>
                          Input
                          <textarea
                            value={testCase.input || ""}
                            onChange={(event) => updateTestCase(index, testCaseIndex, "input", event.target.value)}
                          />
                        </label>
                        <label>
                          Expected output
                          <textarea
                            value={testCase.expectedOutput || ""}
                            onChange={(event) => updateTestCase(index, testCaseIndex, "expectedOutput", event.target.value)}
                            required
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </article>
          ))}
        </section>
        {error && <p className="error">{error}</p>}
        <button className="button wide" type="submit">
          <Rocket size={18} />
          Save contest
        </button>
      </form>
    </section>
  );
}
