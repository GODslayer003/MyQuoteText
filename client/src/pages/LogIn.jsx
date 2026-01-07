// src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  Loader2,
  Shield
} from 'lucide-react';
import { useAuth } from "../hooks/useAuth";

const LoginModal = ({ isOpen, onClose, onSwitchToSignUp }) => {
  const { login, loading, error, clearError } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockUntil, setLockUntil] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setFormData({ email: '', password: '' });
      setFieldErrors({});
      setShowPassword(false);
    }
  }, [isOpen]);

  useEffect(() => {
    // Check if account is locked
    if (lockUntil && lockUntil > Date.now()) {
      setIsLocked(true);
      const timer = setTimeout(() => {
        setIsLocked(false);
        setLockUntil(null);
        setLoginAttempts(0);
      }, lockUntil - Date.now());
      return () => clearTimeout(timer);
    } else {
      setIsLocked(false);
    }
  }, [lockUntil]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field-specific error
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isLocked) {
      const remainingTime = Math.ceil((lockUntil - Date.now()) / 60000); // in minutes
      alert(`Account is locked. Please try again in ${remainingTime} minute(s).`);
      return;
    }

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    const success = await login(formData);
    
    if (!success) {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      
      if (newAttempts >= 5) {
        // Lock account for 2 hours (matching backend)
        const lockTime = Date.now() + (2 * 60 * 60 * 1000);
        setLockUntil(lockTime);
        setIsLocked(true);
      }
    } else {
      // Reset attempts on successful login
      setLoginAttempts(0);
      setLockUntil(null);
      setIsLocked(false);
    }
  };

  const getRemainingLockTime = () => {
    if (!lockUntil || !isLocked) return 0;
    const remaining = lockUntil - Date.now();
    return Math.ceil(remaining / 60000); // Convert to minutes
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      style={{ animation: 'fade-in 0.2s ease-out' }}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl"
        style={{ animation: 'slide-up 0.25s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Close"
          disabled={loading}
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl flex items-center justify-center">
              <LogIn className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
              <p className="text-gray-600">Access your account</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Account locked warning */}
          {isLocked && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-red-800">Account Locked</h3>
                  <p className="text-sm text-red-700 mt-1">
                    Too many failed login attempts. Please try again in{' '}
                    {getRemainingLockTime()} minute(s).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Global error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Login attempts warning */}
          {loginAttempts > 0 && !isLocked && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">
                  {loginAttempts} failed attempt(s). Account will be locked after 5 attempts.
                </span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLocked || loading}
                  className={`w-full pl-10 pr-3 py-2.5 rounded-lg border ${
                    fieldErrors.email
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-orange-500 focus:ring-orange-500'
                  } focus:ring-2 focus:ring-opacity-20 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed`}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => onSwitchToSignUp(true)}
                  className="text-xs text-orange-600 hover:text-orange-700 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLocked || loading}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-lg border ${
                    fieldErrors.password
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-orange-500 focus:ring-orange-500'
                  } focus:ring-2 focus:ring-opacity-20 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  disabled={isLocked || loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading || isLocked}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">
                New to our platform?
              </span>
            </div>
          </div>

          {/* Switch to signup */}
          <div className="text-center">
            <button
              onClick={() => onSwitchToSignUp(false)}
              disabled={loading}
              className="inline-flex items-center text-sm font-medium text-orange-600 hover:text-orange-700 hover:underline disabled:opacity-50"
            >
              Create an account
              <svg className="ml-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Terms and privacy */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              By signing in, you agree to our{' '}
              <button type="button" className="text-orange-600 hover:underline">Terms</button>{' '}
              and{' '}
              <button type="button" className="text-orange-600 hover:underline">Privacy Policy</button>
            </p>
          </div>
        </div>
      </div>

      {/* Background click handler */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
    </div>
  );
};

export default LoginModal;