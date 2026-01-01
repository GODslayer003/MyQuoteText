import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import HeaderFooter from "./Layout/HeaderFooter";
import { AuthProvider } from "./providers/AuthProvider";
import { useAuth } from "./hooks/useAuth";

import Landing from "./pages/Landing";
import HowItWorks from "./pages/HowItWorks";
import Pricing from "./pages/Pricing";
import Guides from "./pages/Guides";
import Contact from "./pages/Contact";
import CheckQuote from "./pages/CheckQuote";
import AboutUs from "./pages/AboutUs";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Profile from "./pages/Profile";

// ------------------------------
// Protected Route
// ------------------------------
const ProtectedRoute = ({ children }) => {
  const { user, requestLogin } = useAuth();

  if (!user) {
    requestLogin(window.location.pathname);
    return null;
  }

  return children;
};

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <HeaderFooter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/guides" element={<Guides />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />

            <Route
              path="/pricing"
              element={
                <ProtectedRoute>
                  <Pricing />
                </ProtectedRoute>
              }
            />

            <Route
              path="/check-quote"
              element={
                <ProtectedRoute>
                  <CheckQuote />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </HeaderFooter>
      </AuthProvider>
    </Router>
  );
}