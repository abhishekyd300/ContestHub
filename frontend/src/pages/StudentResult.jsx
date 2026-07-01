import { Award, CheckCircle2, Trophy, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/client";

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
        <Award size={42} />
        <div>
          <p className="eyebrow">Your score</p>
          <h1>
            {attempt.score} / {attempt.totalMarks}
          </h1>
        </div>
        <Link className="ghost-button" to={`/contests/${contestId}/leaderboard`}>
          <Trophy size={18} />
          Leaderboard
        </Link>
      </div>
      <div className="panel">
        <h2>{attempt.contest.title}</h2>
        <div className="score-list">
          {attempt.answers.map((answer, index) => (
            <article className="answer-result" key={String(answer.questionId)}>
              <div className="section-title">
                <span>Question {index + 1}</span>
                <strong>{answer.marksAwarded} marks</strong>
              </div>
              {answer.type === "coding" && (
                <div className="test-case-list">
                  <p className="muted">Language: {answer.language}</p>
                  {answer.testResults?.map((result, resultIndex) => (
                    <div className={`test-case-result ${result.passed ? "passed" : "failed"}`} key={resultIndex}>
                      <div className="section-title">
                        <strong>Test case {resultIndex + 1}</strong>
                        <span className="result-pill">
                          {result.passed ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
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
