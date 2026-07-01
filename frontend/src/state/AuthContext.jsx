import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("contesthub_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(Boolean(localStorage.getItem("contesthub_token")));

  useEffect(() => {
    const token = localStorage.getItem("contesthub_token");
    if (!token) return;

    api
      .get("/auth/me")
      .then(({ data }) => {
        setUser(data.user);
        localStorage.setItem("contesthub_user", JSON.stringify(data.user));
      })
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("contesthub_token", data.token);
    localStorage.setItem("contesthub_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  async function register(payload) {
    const { data } = await api.post("/auth/register", payload);
    localStorage.setItem("contesthub_token", data.token);
    localStorage.setItem("contesthub_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem("contesthub_token");
    localStorage.removeItem("contesthub_user");
    setUser(null);
  }

  const value = useMemo(
    () => ({ user, loading, login, register, logout, isAuthenticated: Boolean(user) }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
