import React, { createContext, useEffect, useState } from "react";
import LoginModal from "../pages/LogIn";
import SignUpModal from "../pages/Signup";

export const AuthContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [redirectPath, setRedirectPath] = useState(null);

  // ----------------------------------
  // Load user from localStorage
  // ----------------------------------
  useEffect(() => {
    const saved = localStorage.getItem("auth_user");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  // ----------------------------------
  // LOGIN
  // ----------------------------------
  const login = async ({ email, password }) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Invalid credentials");
      }

      setUser(data.user);
      localStorage.setItem("auth_user", JSON.stringify(data.user));
      localStorage.setItem("auth_token", data.token);

      setShowLogin(false);

      if (redirectPath) {
        window.location.href = redirectPath;
        setRedirectPath(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------
  // SIGNUP
  // ----------------------------------
  const signup = async ({ name, email, password }) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Signup failed");
      }

      setUser(data.user);
      localStorage.setItem("auth_user", JSON.stringify(data.user));
      localStorage.setItem("auth_token", data.token);

      setShowSignup(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------
  // LOGOUT
  // ----------------------------------
  const logout = () => {
    setUser(null);
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_token");
  };

  // ----------------------------------
  // REQUIRE LOGIN (FOR PROTECTED ROUTES)
  // ----------------------------------
  const requestLogin = (path) => {
    setRedirectPath(path);
    setShowLogin(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
        requestLogin
      }}
    >
      {children}

      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSwitchToSignUp={() => {
          setShowLogin(false);
          setShowSignup(true);
        }}
      />

      <SignUpModal
        isOpen={showSignup}
        onClose={() => setShowSignup(false)}
        onSwitchToLogin={() => {
          setShowSignup(false);
          setShowLogin(true);
        }}
      />
    </AuthContext.Provider>
  );
};