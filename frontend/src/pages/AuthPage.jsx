import { Code2, GraduationCap, Shield, Terminal, Timer, Trophy } from "lucide-react";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext";

export default function AuthPage() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    rollNumber: "",
    password: "",
    role: "student"
  });
  const [error, setError] = useState("");

  if (user) return <Navigate to="/" replace />;

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      const nextUser =
        mode === "login"
          ? await login(form.email, form.password)
          : await register(form);
      navigate(nextUser.role === "admin" ? "/admin" : "/student");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to continue");
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-panel">
        <div className="auth-intro">
          <Code2 size={40} style={{ color: "var(--accent-light)", filter: "drop-shadow(0 0 12px var(--accent-glow))" }} />
          <h1>ContestHub</h1>
          <p>The ultimate platform for coding contests, MCQ challenges, and competitive programming. Compete, learn, and climb the leaderboard.</p>
          <div className="auth-features">
            <div className="auth-feature">
              <div className="auth-feature-icon">
                <Terminal size={20} />
              </div>
              <span>Multi-language code editor with 15+ languages</span>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon" style={{ background: "var(--green-subtle)", color: "var(--green)" }}>
                <Timer size={20} />
              </div>
              <span>Timed contests with real-time test execution</span>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon" style={{ background: "var(--purple-subtle)", color: "var(--purple)" }}>
                <Trophy size={20} />
              </div>
              <span>Live leaderboards and instant scoring</span>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon" style={{ background: "var(--amber-subtle)", color: "var(--amber)" }}>
                <Shield size={20} />
              </div>
              <span>Admin tools with AI-powered question generation</span>
            </div>
          </div>
        </div>
        <form className="form-card" onSubmit={submit}>
          <div className="segmented">
            <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
              Login
            </button>
            <button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>
              Register
            </button>
          </div>
          {mode === "register" && (
            <>
              <label>
                Name
                <input name="name" value={form.name} onChange={update} placeholder="Enter your full name" required />
              </label>
              <label>
                Roll number
                <input name="rollNumber" value={form.rollNumber} onChange={update} placeholder="e.g. CS2024001" />
              </label>
              <label>
                Role
                <select name="role" value={form.role} onChange={update}>
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
            </>
          )}
          <label>
            Email
            <input type="email" name="email" value={form.email} onChange={update} placeholder="you@university.edu" required />
          </label>
          <label>
            Password
            <input type="password" name="password" value={form.password} onChange={update} placeholder="Min 6 characters" required minLength={6} />
          </label>
          {error && <p className="error">{error}</p>}
          <button className="button wide" type="submit">
            <GraduationCap size={18} />
            {mode === "login" ? "Login" : "Create account"}
          </button>
        </form>
      </section>
    </main>
  );
}
