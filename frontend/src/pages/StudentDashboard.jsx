import { useEffect, useState } from "react";
import api from "../api/client";
import ContestCard from "../components/ContestCard";

export default function StudentDashboard() {
  const [contests, setContests] = useState([]);

  useEffect(() => {
    api.get("/contests").then(({ data }) => setContests(data.contests));
  }, []);

  return (
    <section className="stack">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Student portal</p>
          <h1>Available contests</h1>
        </div>
      </div>
      <div className="grid-list">
        {contests.map((contest) => (
          <ContestCard key={contest._id} contest={contest} role="student" />
        ))}
        {contests.length === 0 && <p className="empty">No published contests are available yet.</p>}
      </div>
    </section>
  );
}
