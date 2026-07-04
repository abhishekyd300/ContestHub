import { format } from "date-fns";
import { BarChart3, CalendarClock, Clock, Code2, PlayCircle, Trophy } from "lucide-react";
import { Link } from "react-router-dom";

export default function ContestCard({ contest, role }) {
  const start = new Date(contest.startAt);
  const status = contest.status;

  return (
    <article className="contest-row-card">
      <div className="contest-row-info">
        <div className="contest-row-title-area">
          <span className={`status ${status}`}>{status}</span>
          <h3>{contest.title}</h3>
        </div>
        <p className="contest-row-desc">{contest.description || "No description provided."}</p>
      </div>
      
      <div className="contest-row-meta">
        <div className="meta-item">
          <CalendarClock size={16} />
          <div>
            <div className="meta-label">Schedule</div>
            <div className="meta-val">{format(start, "dd MMM yyyy, hh:mm a")}</div>
          </div>
        </div>
        <div className="meta-item">
          <Code2 size={16} />
          <div>
            <div className="meta-label">Questions</div>
            <div className="meta-val">{contest.questions?.length || 0} Tasks</div>
          </div>
        </div>
        <div className="meta-item">
          <Clock size={16} />
          <div>
            <div className="meta-label">Duration</div>
            <div className="meta-val">{contest.durationMinutes} Min</div>
          </div>
        </div>
      </div>
      
      <div className="contest-row-actions">
        {role === "student" && (
          <>
            <Link className="button" to={`/student/contests/${contest._id}/attempt`}>
              <PlayCircle size={16} />
              Start
            </Link>
            <Link className="ghost-button" to={`/student/contests/${contest._id}/result`}>
              <BarChart3 size={16} />
              Result
            </Link>
          </>
        )}
        <Link className="ghost-button" to={`/contests/${contest._id}/leaderboard`}>
          <Trophy size={16} />
          Leaderboard
        </Link>
        {role === "admin" && (
          <Link className="button" to={`/admin/contests/${contest._id}/results`}>
            <BarChart3 size={16} />
            Scores
          </Link>
        )}
      </div>
    </article>
  );
}
