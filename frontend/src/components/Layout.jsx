import { LogOut, ShieldCheck, Trophy, Zap } from "lucide-react";
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
          <Zap size={22} />
          <span>ContestHub</span>
        </Link>
        <nav className="topbar-actions">
          {user && (
            <span className="topbar-greeting">
              Welcome, <strong>{user.name || user.email}</strong>
            </span>
          )}
          {user && (
            <span className="role-pill">
              <ShieldCheck size={14} />
              {user.role}
            </span>
          )}
          {user && (
            <button className="ghost-button" onClick={handleLogout}>
              <LogOut size={16} />
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
