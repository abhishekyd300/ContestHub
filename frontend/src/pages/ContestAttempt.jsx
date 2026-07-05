import { CheckCircle2, Clock, Loader2, PlayCircle, Send, XCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Editor } from "@monaco-editor/react";
import api from "../api/client";

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

// Maps our language keys to Monaco editor language IDs
const monacoLanguageMap = {
  python: "python",
  cpp: "cpp",
  c: "c",
  java: "java",
  javascript: "javascript",
  typescript: "typescript",
  go: "go",
  rust: "rust",
  csharp: "csharp",
  ruby: "ruby",
  php: "php",
  kotlin: "kotlin",
  swift: "swift",
  r: "r",
  perl: "perl"
};

function starterFor(question, language) {
  // 1. Check if there is a custom starter code for this specific language in the map
  const codeFromMap = question.starterCodes ? (
    (question.starterCodes instanceof Map)
      ? question.starterCodes.get(language)
      : question.starterCodes[language]
  ) : undefined;
  
  if (codeFromMap !== undefined && codeFromMap.trim() !== "") {
    return codeFromMap;
  }

  // 2. Fallback to the single starterCode field if the selected language is the default language
  const questionDefaultLang = question.language || "python";
  if (question.starterCode && language === questionDefaultLang) {
    return question.starterCode;
  }

  // 3. Fallback to generic template
  return starterTemplates[language] || starterTemplates.python;
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

  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!contest) return;

    const calculateTimeLeft = () => {
      const end = new Date(contest.endAt).getTime();
      const diff = Math.max(0, end - Date.now());
      setTimeLeft(diff);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [contest]);

  const remainingLabel = useMemo(() => {
    if (!contest) return "";
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    if (timeLeft <= 0) return "Time expired";
    return `${minutes}m ${seconds}s remaining`;
  }, [contest, timeLeft]);

  function updateAnswer(question, value) {
    setAnswers((current) => {
      const prev = current[question._id] || {};
      const lang = value.language || prev.language || question.language || "python";
      const codeByLanguage = { ...(prev.codeByLanguage || {}) };

      // Whenever code changes, persist it under the current language
      if (value.code !== undefined) {
        codeByLanguage[lang] = value.code;
      }

      return {
        ...current,
        [question._id]: {
          questionId: question._id,
          type: question.type,
          ...prev,
          ...value,
          codeByLanguage
        }
      };
    });
  }

  function codingAnswer(question) {
    const current = answers[question._id] || {};
    const language = current.language || question.language || "python";
    const codeByLanguage = current.codeByLanguage || {};
    // Read the code saved for this specific language, or fall back to the template
    const code = codeByLanguage[language] ?? starterFor(question, language);
    return {
      questionId: question._id,
      type: question.type,
      language,
      code
    };
  }

  function changeLanguage(question, newLanguage) {
    setAnswers((current) => {
      const prev = current[question._id] || {};
      const oldLanguage = prev.language || question.language || "python";
      const codeByLanguage = { ...(prev.codeByLanguage || {}) };

      // Save whatever is currently in the editor under the OLD language
      if (prev.code !== undefined) {
        codeByLanguage[oldLanguage] = prev.code;
      }

      // Load the code for the NEW language (previously saved, or fresh template)
      const newCode = codeByLanguage[newLanguage] ?? starterFor(question, newLanguage);

      return {
        ...current,
        [question._id]: {
          ...prev,
          questionId: question._id,
          type: question.type,
          language: newLanguage,
          code: newCode,
          codeByLanguage
        }
      };
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
          <span className="timer-bar">
            <Clock size={15} />
            {remainingLabel}
          </span>
          <h1 style={{ marginTop: 10 }}>{contest.title}</h1>
        </div>
        <button className="button" onClick={submit}>
          <Send size={16} />
          Submit
        </button>
      </div>
      {contest.questions.map((question, index) => (
        <article className="question-editor" key={question._id}>
          <div className="section-title">
            <h2 style={{ color: "var(--text-primary)", fontSize: "1.15rem" }}>
              {index + 1}. {question.title}
            </h2>
            <span className="marks">{question.marks} marks</span>
          </div>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>{question.prompt}</p>
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
              onChangeCode={(code) => updateAnswer(question, { code })}
              onChangeLanguage={(language) => changeLanguage(question, language)}
              onRun={() => runCode(question)}
            />
          )}
        </article>
      ))}
      {error && <p className="error">{error}</p>}
      <button className="button wide" onClick={submit}>
        <Send size={16} />
        Submit contest
      </button>
    </section>
  );
}

function CodingQuestion({ answer, isRunning, onChangeCode, onChangeLanguage, onRun, question, result }) {
  const editorRef = useRef(null);

  function handleEditorDidMount(editor) {
    editorRef.current = editor;
  }

  // Map language keys to Monaco language IDs
  const monacoLang = monacoLanguageMap[answer.language] || "plaintext";

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
      <div>
        <p style={{ marginBottom: "8px", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Code editor</p>
        <div style={{ height: "440px", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
          <Editor
            key={`${question._id}-${answer.language}`}
            height="100%"
            language={monacoLang}
            theme="vs-dark"
            value={answer.code}
            onMount={handleEditorDidMount}
            onChange={(value) => onChangeCode(value || "")}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Cascadia Code', Consolas, monospace",
              lineNumbersMinChars: 3,
              padding: { top: 14, bottom: 14 },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 4,
              insertSpaces: true,
              wordWrap: "on",
              renderLineHighlight: "all",
              cursorBlinking: "smooth",
              smoothScrolling: true,
            }}
          />
        </div>
      </div>
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
