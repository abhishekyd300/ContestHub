import { Medal } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/client";

export default function Leaderboard() {
  const { contestId } = useParams();
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    api.get(`/contests/${contestId}/leaderboard`).then(({ data }) => setLeaderboard(data.leaderboard));
  }, [contestId]);

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
              <th>Score</th>
              <th>Submitted</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((attempt, index) => (
              <tr key={attempt._id}>
                <td>
                  <span className="rank">
                    <Medal size={16} />
                    {index + 1}
                  </span>
                </td>
                <td>{attempt.student?.name}</td>
                <td>{attempt.student?.rollNumber || "-"}</td>
                <td>
                  {attempt.score} / {attempt.totalMarks}
                </td>
                <td>{attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {leaderboard.length === 0 && <p className="empty">No submissions yet.</p>}
      </div>
    </section>
  );
}
