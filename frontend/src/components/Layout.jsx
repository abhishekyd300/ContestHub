import { LogOut, ShieldCheck, Trophy } from "lucide-react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/auth");
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/">
          <Trophy size={24} />
          <span>ContestHub</span>
        </Link>
        <nav className="topbar-actions">
          {user && (
            <span className="role-pill">
              <ShieldCheck size={16} />
              {user.role}
            </span>
          )}
          {user && (
            <button className="icon-text-button" onClick={handleLogout}>
              <LogOut size={18} />
              Logout
            </button>
          )}
        </nav>
      </header>
      <main className="page">
        <Outlet />
      </main>
    </div>
  );
}
