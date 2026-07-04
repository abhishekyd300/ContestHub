import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/client";

export default function AdminResults() {
  const { contestId } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/contests/${contestId}/admin-results`).then(({ data }) => setData(data));
  }, [contestId]);

  if (!data) return <div className="screen-message">Loading scores...</div>;

  const submitted = data.attempts.filter((a) => a.submittedAt).length;

  return (
    <section className="stack">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Admin results</p>
          <h1>{data.contest.title}</h1>
        </div>
      </div>
      <div className="stats-row">
        <div className="stat">
          <span>Attempts</span>
          <strong>{data.attempts.length}</strong>
        </div>
        <div className="stat">
          <span>Submitted</span>
          <strong>{submitted}</strong>
        </div>
        <div className="stat">
          <span>Questions</span>
          <strong>{data.contest.questions.length}</strong>
        </div>
      </div>
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Email</th>
              <th>Roll</th>
              <th style={{ minWidth: 180 }}>Score</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.attempts.map((attempt) => {
              const pct = attempt.totalMarks > 0 ? (attempt.score / attempt.totalMarks) * 100 : 0;
              return (
                <tr key={attempt._id}>
                  <td style={{ fontWeight: 600 }}>{attempt.student?.name}</td>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>{attempt.student?.email}</td>
                  <td style={{ color: "var(--text-muted)" }}>{attempt.student?.rollNumber || "-"}</td>
                  <td>
                    <div className="score-bar-container">
                      <div className="score-bar">
                        <div className="score-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="score-text">{attempt.score}/{attempt.totalMarks}</span>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`status ${attempt.submittedAt ? "live" : "scheduled"}`}
                      style={attempt.submittedAt ? {} : { animation: "none" }}
                    >
                      {attempt.submittedAt ? "Submitted" : "In progress"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {data.attempts.length === 0 && (
          <div className="empty-state">
            <p>No students have started this contest yet.</p>
          </div>
        )}
      </div>
    </section>
  );
}
