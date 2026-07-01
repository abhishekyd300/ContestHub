import { PlusCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import ContestCard from "../components/ContestCard";

export default function AdminDashboard() {
  const [contests, setContests] = useState([]);

  useEffect(() => {
    api.get("/contests").then(({ data }) => setContests(data.contests));
  }, []);

  return (
    <section className="stack">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Admin workspace</p>
          <h1>Manage contests</h1>
        </div>
        <Link className="button" to="/admin/contests/new">
          <PlusCircle size={18} />
          New contest
        </Link>
      </div>
      <div className="grid-list">
        {contests.map((contest) => (
          <ContestCard key={contest._id} contest={contest} role="admin" />
        ))}
        {contests.length === 0 && <p className="empty">Create your first contest to begin.</p>}
      </div>
    </section>
  );
}
