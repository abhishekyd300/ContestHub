import { Crown, Medal } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/client";

function rankClass(index) {
  if (index === 0) return "rank-badge rank-1";
  if (index === 1) return "rank-badge rank-2";
  if (index === 2) return "rank-badge rank-3";
  return "rank-badge rank-other";
}

export default function Leaderboard() {
  const { contestId } = useParams();
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    api.get(`/contests/${contestId}/leaderboard`).then(({ data }) => setLeaderboard(data.leaderboard));
  }, [contestId]);

  const maxScore = leaderboard.length > 0 ? Math.max(...leaderboard.map(a => a.totalMarks), 1) : 1;

  return (
    <section className="stack">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Rankings</p>
          <h1>Leaderboard</h1>
        </div>
      </div>
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Student</th>
              <th>Roll</th>
              <th style={{ minWidth: 200 }}>Score</th>
              <th>Submitted</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((attempt, index) => {
              const pct = attempt.totalMarks > 0 ? (attempt.score / attempt.totalMarks) * 100 : 0;
              return (
                <tr key={attempt._id} style={index < 3 ? { background: "rgba(59, 130, 246, 0.03)" } : undefined}>
                  <td>
                    <span className={rankClass(index)}>
                      {index === 0 ? <Crown size={14} /> : <Medal size={14} />}
                      #{index + 1}
                    </span>
                  </td>
                  <td style={{ fontWeight: index < 3 ? 700 : 400 }}>{attempt.student?.name}</td>
                  <td style={{ color: "var(--text-muted)" }}>{attempt.student?.rollNumber || "-"}</td>
                  <td>
                    <div className="score-bar-container">
                      <div className="score-bar">
                        <div className="score-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="score-text">{attempt.score}/{attempt.totalMarks}</span>
                    </div>
                  </td>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {leaderboard.length === 0 && (
          <div className="empty-state">
            <p>No submissions yet. Be the first to compete!</p>
          </div>
        )}
      </div>
    </section>
  );
}
