import React, { useState, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import HeaderFooter from './Layout/HeaderFooter';
import Landing from './pages/Landing';
import HowItWorks from './pages/HowItWorks';
import Pricing from './pages/Pricing';
import Guides from './pages/Guides';
import Contact from './pages/Contact';
import CheckQuote from './pages/CheckQuote';
import AboutUs from './pages/AboutUs';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import LoginModal from './pages/LogIn';
import SignUpModal from './pages/SignUp';
import Profile from './pages/Profile';

// Create Auth Context
const AuthContext = createContext();

// Auth Provider Component
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [redirectPath, setRedirectPath] = useState(null);

  const login = (userData) => {
    setUser(userData);
    setShowLoginModal(false);
    // In real app, you would save token to localStorage
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const signup = (userData) => {
    setUser(userData);
    setShowSignUpModal(false);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const requireAuth = (path) => {
    setRedirectPath(path);
    setShowLoginModal(true);
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      signup,
      logout,
      showLoginModal,
      setShowLoginModal,
      showSignUpModal,
      setShowSignUpModal,
      requireAuth,
      redirectPath
    }}>
      {children}
      <LoginModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToSignUp={() => {
          setShowLoginModal(false);
          setShowSignUpModal(true);
        }}
      />
      <SignUpModal 
        isOpen={showSignUpModal}
        onClose={() => setShowSignUpModal(false)}
        onSwitchToLogin={() => {
          setShowSignUpModal(false);
          setShowLoginModal(true);
        }}
      />
    </AuthContext.Provider>
  );
};

// Custom hook to use auth
export const useAuth = () => useContext(AuthContext);

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, requireAuth } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    // Get current path and store for redirect after login
    const currentPath = window.location.pathname;
    requireAuth(currentPath);
    return null; // Don't render anything, modal will show
  }

  return children;
};

// Main App Component
function App() {
  return (
    <AuthProvider>
      <Router>
        <HeaderFooter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/guides" element={<Guides />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />

            {/* Protected Routes - Show Login Modal if not authenticated */}
            <Route path="/pricing" element={
              <ProtectedRoute>
                <Pricing />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/check-quote" element={
              <ProtectedRoute>
                <CheckQuote />
              </ProtectedRoute>
            } />
            <Route path="/upload" element={
              <ProtectedRoute>
                <CheckQuote />
              </ProtectedRoute>
            } />

            {/* Redirect any unknown route to home */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </HeaderFooter>
      </Router>
    </AuthProvider>
  );
}

export default App;
