import { format } from "date-fns";
import { BarChart3, CalendarClock, PlayCircle, Trophy } from "lucide-react";
import { Link } from "react-router-dom";

export default function ContestCard({ contest, role }) {
  const start = new Date(contest.startAt);
  const end = new Date(contest.endAt);
  const status = contest.status;

  return (
    <article className="contest-card">
      <div>
        <div className={`status ${status}`}>{status}</div>
        <h3>{contest.title}</h3>
        <p>{contest.description || "No description provided."}</p>
      </div>
      <div className="card-meta">
        <span>
          <CalendarClock size={16} />
          {format(start, "dd MMM yyyy, hh:mm a")} - {format(end, "hh:mm a")}
        </span>
        <span>{contest.questions?.length || 0} questions</span>
        <span>{contest.durationMinutes} min</span>
      </div>
      <div className="card-actions">
        {role === "student" && (
          <>
            <Link className="button" to={`/student/contests/${contest._id}/attempt`}>
              <PlayCircle size={18} />
              Start
            </Link>
            <Link className="ghost-button" to={`/student/contests/${contest._id}/result`}>
              <BarChart3 size={18} />
              Result
            </Link>
          </>
        )}
        <Link className="ghost-button" to={`/contests/${contest._id}/leaderboard`}>
          <Trophy size={18} />
          Leaderboard
        </Link>
        {role === "admin" && (
          <Link className="button" to={`/admin/contests/${contest._id}/results`}>
            <BarChart3 size={18} />
            Scores
          </Link>
        )}
      </div>
    </article>
  );
}
