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
  starterCodes: {},
  testCases: [{ input: "", expectedOutput: "" }]
};

const languageOptions = [
  { value: "python", label: "Python 3" },
  { value: "cpp", label: "C++ 17" },
  { value: "c", label: "C" },
  { value: "java", label: "Java 21" },
  { value: "javascript", label: "JavaScript (Node)" },
  { value: "typescript", label: "TypeScript" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "csharp", label: "C#" },
  { value: "ruby", label: "Ruby" },
  { value: "php", label: "PHP" },
  { value: "kotlin", label: "Kotlin" },
  { value: "swift", label: "Swift" },
  { value: "r", label: "R" },
  { value: "perl", label: "Perl" }
];

const starterTemplates = {
  python:
    "import sys\n\ndef solve():\n    input_data = sys.stdin.read().strip()\n    # Write your solution here\n    print(input_data)\n\nif __name__ == \"__main__\":\n    solve()\n",
  cpp:
    "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n\n    // C++17 — structured bindings, if-init, etc. available\n    string line;\n    while (getline(cin, line)) {\n        cout << line << '\\n';\n    }\n    return 0;\n}\n",
  c:
    "#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint main(void) {\n    char buf[4096];\n    while (fgets(buf, sizeof(buf), stdin)) {\n        printf(\"%s\", buf);\n    }\n    return 0;\n}\n",
  java:
    "import java.io.*;\nimport java.util.*;\n\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        // Java 21 — records, pattern matching, etc. available\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder sb = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) {\n            sb.append(line).append('\\n');\n        }\n        System.out.print(sb.toString().trim());\n    }\n}\n",
  javascript:
    "// Node.js — ES2023+ features available\nconst chunks = [];\nprocess.stdin.on('data', (chunk) => chunks.push(chunk));\nprocess.stdin.on('end', () => {\n    const input = Buffer.concat(chunks).toString().trim();\n    // Write your solution here\n    console.log(input);\n});\n",
  typescript:
    "// TypeScript — full type safety\nconst chunks: Buffer[] = [];\nprocess.stdin.on('data', (chunk: Buffer) => chunks.push(chunk));\nprocess.stdin.on('end', () => {\n    const input: string = Buffer.concat(chunks).toString().trim();\n    // Write your solution here\n    console.log(input);\n});\n",
  go:
    "package main\n\nimport (\n\t\"bufio\"\n\t\"fmt\"\n\t\"os\"\n)\n\nfunc main() {\n\tscanner := bufio.NewScanner(os.Stdin)\n\tfor scanner.Scan() {\n\t\tfmt.Println(scanner.Text())\n\t}\n}\n",
  rust:
    "use std::io::{self, Read};\n\nfn main() {\n    let mut input = String::new();\n    io::stdin().read_to_string(&mut input).unwrap();\n    // Write your solution here\n    print!(\"{}\", input.trim());\n}\n",
  csharp:
    "using System;\nusing System.Text;\n\nclass Main {\n    static void Main(string[] args) {\n        var sb = new StringBuilder();\n        string? line;\n        while ((line = Console.ReadLine()) != null) {\n            sb.AppendLine(line);\n        }\n        Console.Write(sb.ToString().Trim());\n    }\n}\n",
  ruby:
    "# Ruby — read all input and process\ninput = $stdin.read.strip\n# Write your solution here\nputs input\n",
  php:
    "<?php\n// PHP 8 — named args, match expressions, etc. available\n$input = trim(file_get_contents('php://stdin'));\n// Write your solution here\necho $input;\n",
  kotlin:
    "fun main() {\n    // Kotlin — modern JVM language\n    val input = generateSequence(::readLine).joinToString(\"\\n\")\n    // Write your solution here\n    println(input.trim())\n}\n",
  swift:
    "import Foundation\n\n// Swift — read all stdin\nvar lines: [String] = []\nwhile let line = readLine() {\n    lines.append(line)\n}\nlet input = lines.joined(separator: \"\\n\")\n// Write your solution here\nprint(input)\n",
  r:
    "# R — read from stdin\ninput <- readLines(con = file(\"stdin\"))\n# Write your solution here\ncat(paste(input, collapse = \"\\n\"), \"\\n\")\n",
  perl:
    "#!/usr/bin/perl\nuse strict;\nuse warnings;\n\n# Read all input\nmy $input = do { local $/; <STDIN> };\nchomp $input;\n# Write your solution here\nprint $input, \"\\n\";\n"
};

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
  const [activeStarterCodeLang, setActiveStarterCodeLang] = useState({});

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
                  <div className="two-column">
                    <label>
                      Default language (for student)
                      <select
                        value={question.language || "python"}
                        onChange={(event) => {
                          const newLang = event.target.value;
                          const currentCodes = question.starterCodes || {};
                          const currentCode = currentCodes[newLang] !== undefined
                            ? currentCodes[newLang]
                            : (starterTemplates[newLang] || "");
                          
                          setContest((current) => {
                            const questions = [...current.questions];
                            questions[index] = {
                              ...questions[index],
                              language: newLang,
                              starterCode: currentCode
                            };
                            return { ...current, questions };
                          });
                        }}
                      >
                        {languageOptions.map((language) => (
                          <option key={language.value} value={language.value}>
                            {language.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Edit starter code for:
                      <select
                        value={activeStarterCodeLang[index] || question.language || "python"}
                        onChange={(event) => {
                          const editLang = event.target.value;
                          setActiveStarterCodeLang((current) => ({
                            ...current,
                            [index]: editLang
                          }));
                        }}
                      >
                        {languageOptions.map((language) => (
                          <option key={language.value} value={language.value}>
                            {language.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label>
                    Starter code ({languageOptions.find(l => l.value === (activeStarterCodeLang[index] || question.language || "python"))?.label})
                    <textarea
                      className="code-area"
                      value={
                        (question.starterCodes || {})[activeStarterCodeLang[index] || question.language || "python"] !== undefined
                          ? (question.starterCodes || {})[activeStarterCodeLang[index] || question.language || "python"]
                          : (activeStarterCodeLang[index] || question.language || "python") === question.language && question.starterCode
                            ? question.starterCode
                            : (starterTemplates[activeStarterCodeLang[index] || question.language || "python"] || "")
                      }
                      onChange={(event) => {
                        const editLang = activeStarterCodeLang[index] || question.language || "python";
                        const newText = event.target.value;
                        const newStarterCodes = { ...(question.starterCodes || {}), [editLang]: newText };
                        
                        setContest((current) => {
                          const questions = [...current.questions];
                          const updatedQuestion = {
                            ...questions[index],
                            starterCodes: newStarterCodes
                          };
                          // If editing the default language, sync with main starterCode
                          if (editLang === question.language) {
                            updatedQuestion.starterCode = newText;
                          }
                          questions[index] = updatedQuestion;
                          return { ...current, questions };
                        });
                      }}
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
