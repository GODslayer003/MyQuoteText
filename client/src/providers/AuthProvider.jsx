// client/src/providers/AuthProvider.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AuthModal from "../pages/AuthModel";

export const AuthContext = createContext(null);

// Export useAuth hook for convenience
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
};

// Get API base URL
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";
const API_VERSION = import.meta.env.VITE_API_VERSION || "v1";
const API_URL = `${API_BASE}/api/${API_VERSION}`;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [redirectPath, setRedirectPath] = useState(null);
  const navigate = useNavigate();

  // ----------------------------------
  // Load user from localStorage and validate
  // ----------------------------------
  useEffect(() => {
    const loadUser = async () => {
      const saved = localStorage.getItem("auth_user");
      const token = localStorage.getItem("auth_token");

      if (saved && token) {
        try {
          const parsedUser = JSON.parse(saved);

          // Validate token by fetching profile
          try {
            const response = await fetch(`${API_URL}/users/me`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
              }
            });

            if (response.ok) {
              const data = await response.json();
              setUser(data.data);
            } else {
              // Token invalid, clear storage
              localStorage.removeItem("auth_user");
              localStorage.removeItem("auth_token");
              setUser(null);
            }
          } catch (validationError) {
            console.error('Token validation failed:', validationError);
            setUser(null);
          }
        } catch (e) {
          console.error("Error parsing saved user:", e);
          localStorage.removeItem("auth_user");
          localStorage.removeItem("auth_token");
          setUser(null);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  // ----------------------------------
  // REFRESH USER
  // ----------------------------------
  const refreshUser = async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.data);
        localStorage.setItem("auth_user", JSON.stringify(data.data));
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  // ----------------------------------
  // UPDATE USER FUNCTION
  // ----------------------------------
  const updateUser = useCallback(async (updates) => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return false;

      const response = await fetch(`${API_URL}/users/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        },
        body: JSON.stringify(updates)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update local state
        setUser(prev => ({
          ...prev,
          ...data.data.user
        }));

        // Update localStorage
        localStorage.setItem("auth_user", JSON.stringify({
          ...user,
          ...data.data.user
        }));

        return true;
      } else {
        throw new Error(data.error || "Failed to update user");
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      return false;
    }
  }, [user]);

  // ----------------------------------
  // LOGIN - Production Ready
  // ----------------------------------
  const login = async ({ email, password }) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        credentials: 'include',
        body: JSON.stringify({
          email: email.toLowerCase(),
          password: password
        })
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle specific error cases
        if (res.status === 401) {
          throw new Error("Invalid email or password");
        } else if (res.status === 423) {
          throw new Error("Account is locked. Please try again later.");
        } else {
          throw new Error(data.error || data.message || "Login failed");
        }
      }

      if (!data.success || !data.data?.user) {
        throw new Error("Invalid response from server");
      }

      const { user: userData, tokens } = data.data;

      // Set user state
      setUser(userData);

      // Store in localStorage
      localStorage.setItem("auth_user", JSON.stringify(userData));
      localStorage.setItem("auth_token", tokens.accessToken);
      localStorage.setItem("refresh_token", tokens.refreshToken);

      // Close modal and handle redirect
      setShowAuthModal(false);
      if (redirectPath) {
        navigate(redirectPath);
        setRedirectPath(null);
      }

      return true;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || "Login failed. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------
  // SIGNUP - Production Ready
  // ----------------------------------
  const signup = async (userData) => {
    setLoading(true);
    setError(null);

    try {
      const payload = {
        email: userData.email.toLowerCase(),
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone || undefined
      };

      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle validation errors
        if (data.errors) {
          const validationErrors = Object.values(data.errors).join(', ');
          throw new Error(validationErrors);
        }
        throw new Error(data.error || data.message || "Registration failed");
      }

      if (!data.success || !data.data?.user) {
        throw new Error("Invalid response from server");
      }

      const { user: userDataResponse, accessToken } = data.data;

      // Set user state
      setUser(userDataResponse);

      // Store in localStorage
      localStorage.setItem("auth_user", JSON.stringify(userDataResponse));
      localStorage.setItem("auth_token", accessToken);

      setShowAuthModal(false);
      return true;
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message || "Registration failed. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------
  // LOGOUT - Production Ready
  // ----------------------------------
  const logout = () => {
    setUser(null);
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_token");
    // Optional: Call backend logout endpoint
    fetch(`${API_URL}/auth/logout`, { method: 'POST' }).catch(console.error);
  };

  // ----------------------------------
  // REQUIRE LOGIN (FOR PROTECTED ROUTES)
  // ----------------------------------
  const requestLogin = useCallback((path) => {
    if (user) return; // Already logged in

    setRedirectPath(path);
    setShowAuthModal(true);
  }, [user]); // Removed showAuthModal to stabilize identity and stop loops

  // ----------------------------------
  // CLEAR ERROR
  // ----------------------------------
  const clearError = () => {
    setError(null);
  };

  // ----------------------------------
  // SHOW AUTH MODAL
  // ----------------------------------
  const openAuthModal = () => {
    setShowAuthModal(true);
    clearError();
  };

  // ----------------------------------
  // UPLOAD AVATAR
  // ----------------------------------
  const uploadAvatar = async (file) => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return null;

      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(`${API_URL}/users/me/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update user state
        setUser(prev => ({
          ...prev,
          ...data.data.user
        }));

        // Update localStorage
        localStorage.setItem("auth_user", JSON.stringify({
          ...user,
          ...data.data.user
        }));

        return data.data.avatarUrl;
      } else {
        throw new Error(data.error || "Failed to upload avatar");
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      throw error;
    }
  };

  // ----------------------------------
  // REMOVE AVATAR
  // ----------------------------------
  const removeAvatar = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return false;

      const response = await fetch(`${API_URL}/users/me/avatar`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update user state
        setUser(prev => ({
          ...prev,
          avatarUrl: null
        }));

        // Update localStorage
        localStorage.setItem("auth_user", JSON.stringify({
          ...user,
          avatarUrl: null
        }));

        return true;
      } else {
        throw new Error(data.error || "Failed to remove avatar");
      }
    } catch (error) {
      console.error('Avatar removal error:', error);
      return false;
    }
  };

  // ----------------------------------
  // CHANGE PASSWORD
  // ----------------------------------
  const changePassword = async (passwordData) => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return false;

      const response = await fetch(`${API_URL}/users/me/password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(passwordData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return true;
      } else {
        throw new Error(data.error || "Failed to change password");
      }
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  };

  // ----------------------------------
  // DELETE ACCOUNT
  // ----------------------------------
  const deleteAccount = async (confirmPassword) => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return false;

      const response = await fetch(`${API_URL}/users/me`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ confirmPassword })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Logout after successful deletion
        logout();
        return true;
      } else {
        throw new Error(data.error || "Failed to delete account");
      }
    } catch (error) {
      console.error('Delete account error:', error);
      throw error;
    }
  };

  // Context value memoized to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    loading,
    error,
    login,
    signup,
    logout,
    updateUser,
    refreshUser,
    uploadAvatar,
    removeAvatar,
    changePassword,
    deleteAccount,
    isAuthenticated: !!user,
    requestLogin,
    clearError,
    showLogin: openAuthModal
  }), [
    user, loading, error, login, signup, logout,
    updateUser, refreshUser, uploadAvatar, removeAvatar,
    changePassword, deleteAccount, requestLogin
  ]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          clearError();
          // If on a protected route and closing modal, redirect to home
          const protectedRoutes = ['/check-quote', '/profile'];
          if (protectedRoutes.some(route => window.location.pathname.startsWith(route)) && !user) {
            navigate('/');
          }
          setRedirectPath(null);
        }}
      />
    </AuthContext.Provider>
  );
};