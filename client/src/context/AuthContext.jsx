import { createContext, useContext, useState, useCallback } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("ss_token"));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("ss_user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback((tokenValue, userData) => {
    localStorage.setItem("ss_token", tokenValue);
    localStorage.setItem("ss_user", JSON.stringify(userData));
    setToken(tokenValue);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("ss_token");
    localStorage.removeItem("ss_user");
    setToken(null);
    setUser(null);
  }, []);

  const isAdmin = user?.role === "admin";
  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAdmin, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
