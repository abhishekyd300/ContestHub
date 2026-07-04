import { BookOpen, CheckCircle2, Radio, Rocket } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import api from "../api/client";
import ContestCard from "../components/ContestCard";

export default function StudentDashboard() {
  const [contests, setContests] = useState([]);

  useEffect(() => {
    api.get("/contests").then(({ data }) => setContests(data.contests));
  }, []);

  const counts = useMemo(() => {
    let live = 0, upcoming = 0, completed = 0;
    for (const c of contests) {
      if (c.status === "live") live++;
      else if (c.status === "scheduled") upcoming++;
      else if (c.status === "completed") completed++;
    }
    return { live, upcoming, completed };
  }, [contests]);

  return (
    <section className="stack">
      <div className="dashboard-hero">
        <p className="eyebrow">Student portal</p>
        <h1>Ready to compete?</h1>
        <p>Browse available contests, sharpen your coding skills, and climb the leaderboard. Your next challenge awaits.</p>
        <div className="dashboard-stats">
          <div className="dashboard-stat">
            <div className="dashboard-stat-icon live">
              <Radio size={20} />
            </div>
            <div>
              <div className="dashboard-stat-value">{counts.live}</div>
              <div className="dashboard-stat-label">Live now</div>
            </div>
          </div>
          <div className="dashboard-stat">
            <div className="dashboard-stat-icon upcoming">
              <Rocket size={20} />
            </div>
            <div>
              <div className="dashboard-stat-value">{counts.upcoming}</div>
              <div className="dashboard-stat-label">Upcoming</div>
            </div>
          </div>
          <div className="dashboard-stat">
            <div className="dashboard-stat-icon done">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div className="dashboard-stat-value">{counts.completed}</div>
              <div className="dashboard-stat-label">Completed</div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-heading">
        <div>
          <h2 style={{ color: "var(--text-primary)", fontSize: "1.3rem" }}>All contests</h2>
        </div>
      </div>

      {contests.length > 0 ? (
        <div className="contest-list">
          {contests.map((contest) => (
            <ContestCard key={contest._id} contest={contest} role="student" />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">
            <BookOpen size={28} />
          </div>
          <h3 style={{ color: "var(--text-secondary)" }}>No contests available</h3>
          <p>Check back later for upcoming coding challenges and competitions.</p>
        </div>
      )}
    </section>
  );
}
