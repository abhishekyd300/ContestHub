import { Code2, GraduationCap } from "lucide-react";
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
          <Code2 size={36} />
          <h1>ContestHub</h1>
          <p>Run coding and MCQ contests with scheduled access, scoring, and leaderboards.</p>
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
                <input name="name" value={form.name} onChange={update} required />
              </label>
              <label>
                Roll number
                <input name="rollNumber" value={form.rollNumber} onChange={update} />
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
            <input type="email" name="email" value={form.email} onChange={update} required />
          </label>
          <label>
            Password
            <input type="password" name="password" value={form.password} onChange={update} required minLength={6} />
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
