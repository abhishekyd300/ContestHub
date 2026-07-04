import { BookOpen, CheckCircle2, PlusCircle, Radio, Settings } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import ContestCard from "../components/ContestCard";

export default function AdminDashboard() {
  const [contests, setContests] = useState([]);

  useEffect(() => {
    api.get("/contests").then(({ data }) => setContests(data.contests));
  }, []);

  const counts = useMemo(() => {
    let live = 0, total = 0, completed = 0;
    for (const c of contests) {
      total++;
      if (c.status === "live") live++;
      else if (c.status === "completed") completed++;
    }
    return { live, total, completed };
  }, [contests]);

  return (
    <section className="stack">
      <div className="dashboard-hero">
        <p className="eyebrow">Admin workspace</p>
        <h1>Command center</h1>
        <p>Create, manage, and monitor your coding contests. Track student performance with real-time analytics.</p>
        <div className="dashboard-stats">
          <div className="dashboard-stat">
            <div className="dashboard-stat-icon live">
              <Radio size={20} />
            </div>
            <div>
              <div className="dashboard-stat-value">{counts.live}</div>
              <div className="dashboard-stat-label">Active</div>
            </div>
          </div>
          <div className="dashboard-stat">
            <div className="dashboard-stat-icon upcoming">
              <Settings size={20} />
            </div>
            <div>
              <div className="dashboard-stat-value">{counts.total}</div>
              <div className="dashboard-stat-label">Total</div>
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
          <h2 style={{ color: "var(--text-primary)", fontSize: "1.3rem" }}>Your contests</h2>
        </div>
        <Link className="button" to="/admin/contests/new">
          <PlusCircle size={16} />
          New contest
        </Link>
      </div>

      {contests.length > 0 ? (
        <div className="contest-list">
          {contests.map((contest) => (
            <ContestCard key={contest._id} contest={contest} role="admin" />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">
            <BookOpen size={28} />
          </div>
          <h3 style={{ color: "var(--text-secondary)" }}>No contests yet</h3>
          <p>Create your first contest to get started.</p>
        </div>
      )}
    </section>
  );
}
