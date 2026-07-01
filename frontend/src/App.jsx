import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import AdminContestForm from "./pages/AdminContestForm";
import AdminDashboard from "./pages/AdminDashboard";
import AdminResults from "./pages/AdminResults";
import AuthPage from "./pages/AuthPage";
import ContestAttempt from "./pages/ContestAttempt";
import Leaderboard from "./pages/Leaderboard";
import StudentDashboard from "./pages/StudentDashboard";
import StudentResult from "./pages/StudentResult";
import { useAuth } from "./state/AuthContext";

function Protected({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="screen-message">Loading session...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  return <Navigate to={user.role === "admin" ? "/admin" : "/student"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route element={<Layout />}>
        <Route path="/" element={<HomeRedirect />} />
        <Route
          path="/admin"
          element={
            <Protected role="admin">
              <AdminDashboard />
            </Protected>
          }
        />
        <Route
          path="/admin/contests/new"
          element={
            <Protected role="admin">
              <AdminContestForm />
            </Protected>
          }
        />
        <Route
          path="/admin/contests/:contestId/results"
          element={
            <Protected role="admin">
              <AdminResults />
            </Protected>
          }
        />
        <Route
          path="/student"
          element={
            <Protected role="student">
              <StudentDashboard />
            </Protected>
          }
        />
        <Route
          path="/student/contests/:contestId/attempt"
          element={
            <Protected role="student">
              <ContestAttempt />
            </Protected>
          }
        />
        <Route
          path="/student/contests/:contestId/result"
          element={
            <Protected role="student">
              <StudentResult />
            </Protected>
          }
        />
        <Route
          path="/contests/:contestId/leaderboard"
          element={
            <Protected>
              <Leaderboard />
            </Protected>
          }
        />
      </Route>
    </Routes>
  );
}
