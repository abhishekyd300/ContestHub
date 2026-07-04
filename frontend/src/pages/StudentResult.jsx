import { Award, CheckCircle2, Trophy, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/client";

function ScoreCircle({ score, total }) {
  const pct = total > 0 ? (score / total) * 100 : 0;
  const r = 58;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="score-circle-container">
      <div className="score-circle">
        <svg viewBox="0 0 140 140">
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--accent)" />
              <stop offset="50%" stopColor="var(--cyan)" />
              <stop offset="100%" stopColor="var(--green)" />
            </linearGradient>
          </defs>
          <circle className="score-circle-bg" cx="70" cy="70" r={r} />
          <circle
            className="score-circle-fill"
            cx="70"
            cy="70"
            r={r}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="score-circle-text">
          <span className="score-circle-value">{Math.round(pct)}%</span>
          <span className="score-circle-label">Score</span>
        </div>
      </div>
    </div>
  );
}

export default function StudentResult() {
  const { contestId } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/contests/${contestId}/results/me`)
      .then(({ data }) => setAttempt(data.attempt))
      .catch((err) => setError(err.response?.data?.message || "Result is not available yet"));
  }, [contestId]);

  if (error) return <p className="error">{error}</p>;
  if (!attempt) return <div className="screen-message">Loading result...</div>;

  return (
    <section className="stack">
      <div className="result-band">
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <ScoreCircle score={attempt.score} total={attempt.totalMarks} />
          <div>
            <p className="eyebrow">Your score</p>
            <h1>
              {attempt.score} / {attempt.totalMarks}
            </h1>
          </div>
        </div>
        <Link className="ghost-button" to={`/contests/${contestId}/leaderboard`}>
          <Trophy size={16} />
          Leaderboard
        </Link>
      </div>
      <div className="panel">
        <h2 style={{ color: "var(--text-primary)" }}>{attempt.contest.title}</h2>
        <div className="score-list">
          {attempt.answers.map((answer, index) => (
            <article className="answer-result" key={String(answer.questionId)}>
              <div className="section-title">
                <span style={{ color: "var(--text-secondary)" }}>Question {index + 1}</span>
                <strong style={{ color: answer.marksAwarded > 0 ? "var(--green)" : "var(--text-muted)" }}>
                  {answer.marksAwarded > 0 ? `+${answer.marksAwarded}` : "0"} marks
                </strong>
              </div>
              {answer.type === "coding" && (
                <div className="test-case-list">
                  <p className="muted" style={{ fontSize: "0.85rem" }}>Language: {answer.language}</p>
                  {answer.testResults?.map((result, resultIndex) => (
                    <div className={`test-case-result ${result.passed ? "passed" : "failed"}`} key={resultIndex}>
                      <div className="section-title">
                        <strong style={{ color: "var(--text-primary)", fontSize: "0.85rem" }}>Test case {resultIndex + 1}</strong>
                        <span className="result-pill">
                          {result.passed ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                          {result.passed ? "Passed" : "Failed"}
                        </span>
                      </div>
                      <div className="two-column">
                        <div className="sample-box">
                          <strong>Expected output</strong>
                          <pre>{result.expectedOutput || "-"}</pre>
                        </div>
                        <div className="sample-box">
                          <strong>Your output</strong>
                          <pre>{result.actualOutput || "-"}</pre>
                        </div>
                      </div>
                      {result.error && <pre className="run-error">{result.error}</pre>}
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
