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
          <strong>{data.attempts.filter((attempt) => attempt.submittedAt).length}</strong>
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
              <th>Score</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.attempts.map((attempt) => (
              <tr key={attempt._id}>
                <td>{attempt.student?.name}</td>
                <td>{attempt.student?.email}</td>
                <td>{attempt.student?.rollNumber || "-"}</td>
                <td>
                  {attempt.score} / {attempt.totalMarks}
                </td>
                <td>{attempt.submittedAt ? "Submitted" : "Started"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.attempts.length === 0 && <p className="empty">No students have started this contest.</p>}
      </div>
    </section>
  );
}
