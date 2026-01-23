// src/pages/AuthModal.jsx
import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  LogIn,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Shield,
  ArrowLeft,
  Key
} from 'lucide-react';
import { useAuth } from "../hooks/useAuth";

const AuthModal = ({ isOpen, onClose }) => {
  const { login, signup, loading, error, clearError } = useAuth();

  // Mode: 'login', 'signup', or 'forgot-password'
  const [mode, setMode] = useState('login');

  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  // Signup form state
  const [signupData, setSignupData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  // Forgot password state
  const [forgotPasswordData, setForgotPasswordData] = useState({
    email: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockUntil, setLockUntil] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Captcha State
  const [captchaToken, setCaptchaToken] = useState(null);
  const [mathCaptcha, setMathCaptcha] = useState({ q: '', a: '' });
  const [mathAnswer, setMathAnswer] = useState('');
  const [isMathVerified, setIsMathVerified] = useState(false);
  const [useRecaptcha, setUseRecaptcha] = useState(true); // Toggle between systems if needed, or use both.

  useEffect(() => {
    generateMathCaptcha();
  }, [isOpen]);

  const generateMathCaptcha = () => {
    const n1 = Math.floor(Math.random() * 10) + 1;
    const n2 = Math.floor(Math.random() * 10) + 1;
    setMathCaptcha({ q: `${n1} + ${n2}`, a: (n1 + n2).toString() });
    setMathAnswer('');
    setIsMathVerified(false);
  };

  const verifyMathCaptcha = () => {
    if (mathAnswer.trim() === mathCaptcha.a) {
      setIsMathVerified(true);
      return true;
    }
    return false;
  };
  useEffect(() => {
    if (!isOpen) {
      resetForms();
    }
  }, [isOpen]);

  useEffect(() => {
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

  // ---------------------------
  // Form Helpers
  // ---------------------------
  const resetForms = () => {
    setLoginData({ email: '', password: '' });
    setSignupData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: ''
    });
    setForgotPasswordData({ email: '' });
    setShowPassword(false);
    setShowConfirmPassword(false);
    setFieldErrors({});
    setLoginAttempts(0);
    setPasswordStrength(0);
    setAcceptedTerms(false);
    setResetSent(false);
    clearError();
  };

  const switchToSignup = () => {
    setMode('signup');
    clearError();
  };

  const switchToLogin = () => {
    setMode('login');
    clearError();
  };

  const switchToForgotPassword = () => {
    setMode('forgot-password');
    clearError();
  };

  const getRemainingLockTime = () => {
    if (!lockUntil || !isLocked) return 0;
    const remaining = lockUntil - Date.now();
    return Math.ceil(remaining / 60000);
  };

  // ---------------------------
  // Login Functions
  // ---------------------------
  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateLogin = () => {
    const errors = {};
    if (!loginData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!loginData.password) {
      errors.password = 'Password is required';
    }
    return errors;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    if (isLocked) {
      const remainingTime = getRemainingLockTime();
      alert(`Account is locked. Please try again in ${remainingTime} minute(s).`);
      return;
    }

    const validationErrors = validateLogin();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    // Verify Captcha interaction
    if (!verifyMathCaptcha()) {
      setFieldErrors(prev => ({ ...prev, password: 'Incorrect security answer. Please try again.' }));
      generateMathCaptcha(); // Reset on failure
      return;
    }

    const result = await login(loginData);

    if (!result.success) {
      // Check for lock info from backend
      if (result.lockUntil) {
        setLockUntil(new Date(result.lockUntil).getTime());
        setIsLocked(true);
        setLoginAttempts(5); // Force lock state locally
      } else {
        // Increment attempts locally for immediate feedback (optional, but good for UI consistency)
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);

        // If we hit 5 local attempts but backend didn't lock yet (async sync issue?), 
        // we can warn user, but backend is source of truth.
      }
    } else {
      setLoginAttempts(0);
      setLockUntil(null);
      setIsLocked(false);
      onClose();
    }
  };

  // ---------------------------
  // Signup Functions
  // ---------------------------
  const handleSignupChange = (e) => {
    const { name, value } = e.target;

    let formattedValue = value;
    if (name === 'phone') {
      formattedValue = value.replace(/[^\d+]/g, '');
    }

    setSignupData(prev => ({ ...prev, [name]: formattedValue }));

    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(formattedValue));
    }

    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 10;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[a-z]/.test(password)) strength += 10;
    if (/[0-9]/.test(password)) strength += 20;
    if (/[^A-Za-z0-9]/.test(password)) strength += 20;
    return Math.min(strength, 100);
  };

  const validateSignup = () => {
    const errors = {};

    if (!signupData.firstName.trim()) {
      errors.firstName = 'First name is required';
    } else if (signupData.firstName.trim().length < 2) {
      errors.firstName = 'First name must be at least 2 characters';
    }

    if (!signupData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    } else if (signupData.lastName.trim().length < 2) {
      errors.lastName = 'Last name must be at least 2 characters';
    }

    if (!signupData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (signupData.phone && !/^[\d+\s\-()]{10,}$/.test(signupData.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }

    if (!signupData.password) {
      errors.password = 'Password is required';
    } else if (signupData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (passwordStrength < 50) {
      errors.password = 'Password is too weak';
    }

    if (!signupData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (signupData.password !== signupData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!acceptedTerms) {
      errors.terms = 'You must accept the terms and conditions';
    }

    return errors;
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateSignup();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    const userData = {
      email: signupData.email.trim().toLowerCase(),
      password: signupData.password,
      firstName: signupData.firstName.trim(),
      lastName: signupData.lastName.trim(),
      ...(signupData.phone && { phone: signupData.phone.trim() }),
      metadata: {
        registrationSource: 'manual',
        ipAddress: '',
        userAgent: navigator.userAgent
      }
    };

    const success = await signup(userData);
    if (success) {
      onClose();
    }
  };

  // ---------------------------
  // Forgot Password Functions
  // ---------------------------
  const handleForgotPasswordChange = (e) => {
    const { name, value } = e.target;
    setForgotPasswordData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForgotPassword = () => {
    const errors = {};
    if (!forgotPasswordData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotPasswordData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    return errors;
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForgotPassword();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    // TODO: Implement actual forgot password API call
    // For now, simulate API call
    setTimeout(() => {
      setResetSent(true);
      clearError();
    }, 1500);
  };

  // ---------------------------
  // Password Requirements
  // ---------------------------
  const passwordRequirements = [
    { text: 'At least 8 characters', check: signupData.password.length >= 8 },
    { text: 'Contains uppercase letter', check: /[A-Z]/.test(signupData.password) },
    { text: 'Contains lowercase letter', check: /[a-z]/.test(signupData.password) },
    { text: 'Contains number', check: /[0-9]/.test(signupData.password) },
    { text: 'Contains special character', check: /[^A-Za-z0-9]/.test(signupData.password) }
  ];

  const getStrengthLabel = (strength) => {
    if (strength < 25) return 'Very Weak';
    if (strength < 50) return 'Weak';
    if (strength < 75) return 'Fair';
    if (strength < 90) return 'Good';
    return 'Strong';
  };

  const getStrengthColor = (strength) => {
    if (strength < 25) return 'bg-red-500';
    if (strength < 50) return 'bg-orange-500';
    if (strength < 75) return 'bg-yellow-500';
    if (strength < 90) return 'bg-blue-500';
    return 'bg-green-500';
  };

  if (!isOpen) return null;

  // ---------------------------
  // Render
  // ---------------------------
  const renderIcon = () => {
    switch (mode) {
      case 'login':
        return <LogIn className="w-6 h-6 text-white" />;
      case 'signup':
        return <UserPlus className="w-6 h-6 text-white" />;
      case 'forgot-password':
        return <Key className="w-6 h-6 text-white" />;
      default:
        return <LogIn className="w-6 h-6 text-white" />;
    }
  };

  const renderTitle = () => {
    switch (mode) {
      case 'login':
        return 'Sign In';
      case 'signup':
        return 'Create Account';
      case 'forgot-password':
        return 'Reset Password';
      default:
        return 'Sign In';
    }
  };

  const renderSubtitle = () => {
    switch (mode) {
      case 'login':
        return 'Access your account';
      case 'signup':
        return 'Join thousands of smart homeowners';
      case 'forgot-password':
        return "We'll send you a reset link";
      default:
        return 'Access your account';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto"
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

        {/* Back button (not for login mode) */}
        {mode !== 'login' && (
          <button
            onClick={switchToLogin}
            className="absolute top-4 left-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Back to login"
            disabled={loading}
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
        )}

        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl flex items-center justify-center">
              {renderIcon()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {renderTitle()}
              </h2>
              <p className="text-gray-600">
                {renderSubtitle()}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Account locked warning */}
          {isLocked && mode === 'login' && (
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
          {loginAttempts > 0 && !isLocked && mode === 'login' && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">
                  {loginAttempts} failed attempt(s). Account will be locked after 5 attempts.
                </span>
              </div>
            </div>
          )}

          {/* Reset password success */}
          {resetSent && mode === 'forgot-password' && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-green-800">Reset Link Sent</h3>
                  <p className="text-sm text-green-700 mt-1">
                    If an account exists with {forgotPasswordData.email}, you will receive a password reset link shortly.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Forms */}
          {mode === 'login' && (
            <LoginForm
              loginData={loginData}
              handleLoginChange={handleLoginChange}
              handleLoginSubmit={handleLoginSubmit}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              fieldErrors={fieldErrors}
              loading={loading}
              isLocked={isLocked}
              onForgotPassword={switchToForgotPassword}
              onSwitchToSignup={switchToSignup}
              widthMathCaptcha={mathCaptcha}
              widthMathAnswer={mathAnswer}
              setMathAnswer={setMathAnswer}
              setRecaptchaToken={setCaptchaToken}
            />
          )}

          {mode === 'signup' && (
            <SignupForm
              signupData={signupData}
              handleSignupChange={handleSignupChange}
              handleSignupSubmit={handleSignupSubmit}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              showConfirmPassword={showConfirmPassword}
              setShowConfirmPassword={setShowConfirmPassword}
              fieldErrors={fieldErrors}
              loading={loading}
              passwordStrength={passwordStrength}
              acceptedTerms={acceptedTerms}
              setAcceptedTerms={setAcceptedTerms}
              passwordRequirements={passwordRequirements}
              onSwitchToLogin={switchToLogin}
              getStrengthLabel={getStrengthLabel}
              getStrengthColor={getStrengthColor}
            />
          )}

          {mode === 'forgot-password' && !resetSent && (
            <ForgotPasswordForm
              forgotPasswordData={forgotPasswordData}
              handleForgotPasswordChange={handleForgotPasswordChange}
              handleForgotPasswordSubmit={handleForgotPasswordSubmit}
              fieldErrors={fieldErrors}
              loading={loading}
              onSwitchToLogin={switchToLogin}
            />
          )}

          {mode === 'forgot-password' && resetSent && (
            <div className="text-center">
              <button
                onClick={switchToLogin}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow"
              >
                Back to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------------------------
// Sub-Components
// ---------------------------
const LoginForm = ({
  loginData,
  handleLoginChange,
  handleLoginSubmit,
  showPassword,
  setShowPassword,
  fieldErrors,
  loading,
  isLocked,
  onForgotPassword,
  onSwitchToSignup,
  widthMathCaptcha,
  widthMathAnswer,
  setMathAnswer
}) => (
  <form onSubmit={handleLoginSubmit} className="space-y-4">
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
          value={loginData.email}
          onChange={handleLoginChange}
          disabled={isLocked || loading}
          className={`w-full pl-10 pr-3 py-2.5 rounded-lg border ${fieldErrors.email
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
          onClick={onForgotPassword}
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
          value={loginData.password}
          onChange={handleLoginChange}
          disabled={isLocked || loading}
          className={`w-full pl-10 pr-10 py-2.5 rounded-lg border ${fieldErrors.password
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

    {/* Temporary Math Captcha */}
    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Security Check: What is {widthMathCaptcha?.q || '2+2'}?
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={widthMathAnswer}
          onChange={(e) => setMathAnswer(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          placeholder="Answer"
        />
      </div>
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
        type="button"
        onClick={onSwitchToSignup}
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
  </form>
);

const SignupForm = ({
  signupData,
  handleSignupChange,
  handleSignupSubmit,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  fieldErrors,
  loading,
  passwordStrength,
  acceptedTerms,
  setAcceptedTerms,
  passwordRequirements,
  onSwitchToLogin,
  getStrengthLabel,
  getStrengthColor
}) => (
  <form onSubmit={handleSignupSubmit} className="space-y-4">
    {/* Name fields */}
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          First Name
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            name="firstName"
            value={signupData.firstName}
            onChange={handleSignupChange}
            disabled={loading}
            className={`w-full pl-10 pr-3 py-2.5 rounded-lg border ${fieldErrors.firstName
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-orange-500 focus:ring-orange-500'
              } focus:ring-2 focus:ring-opacity-20 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed`}
            placeholder="John"
            autoComplete="given-name"
          />
        </div>
        {fieldErrors.firstName && (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.firstName}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Last Name
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            name="lastName"
            value={signupData.lastName}
            onChange={handleSignupChange}
            disabled={loading}
            className={`w-full pl-10 pr-3 py-2.5 rounded-lg border ${fieldErrors.lastName
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-orange-500 focus:ring-orange-500'
              } focus:ring-2 focus:ring-opacity-20 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed`}
            placeholder="Doe"
            autoComplete="family-name"
          />
        </div>
        {fieldErrors.lastName && (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.lastName}</p>
        )}
      </div>
    </div>

    {/* Phone */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Phone Number
      </label>
      <div className="relative">
        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          name="phone"
          type="tel"
          value={signupData.phone}
          onChange={handleSignupChange}
          disabled={loading}
          className={`w-full pl-10 pr-3 py-2.5 rounded-lg border ${fieldErrors.phone
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-orange-500 focus:ring-orange-500'
            } focus:ring-2 focus:ring-opacity-20 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed`}
          placeholder="+61 412 345 678"
          autoComplete="tel"
        />
      </div>
      {fieldErrors.phone && (
        <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>
      )}
    </div>

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
          value={signupData.email}
          onChange={handleSignupChange}
          disabled={loading}
          className={`w-full pl-10 pr-3 py-2.5 rounded-lg border ${fieldErrors.email
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
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Password
      </label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          name="password"
          type={showPassword ? 'text' : 'password'}
          value={signupData.password}
          onChange={handleSignupChange}
          disabled={loading}
          className={`w-full pl-10 pr-10 py-2.5 rounded-lg border ${fieldErrors.password
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-orange-500 focus:ring-orange-500'
            } focus:ring-2 focus:ring-opacity-20 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed`}
          placeholder="••••••••"
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={() => setShowPassword(p => !p)}
          disabled={loading}
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

      {/* Password strength indicator */}
      {signupData.password && (
        <div className="mt-2 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Password strength</span>
            <span className={`font-medium ${passwordStrength < 25 ? 'text-red-600' :
              passwordStrength < 50 ? 'text-orange-600' :
                passwordStrength < 75 ? 'text-yellow-600' :
                  passwordStrength < 90 ? 'text-blue-600' : 'text-green-600'
              }`}>
              {getStrengthLabel(passwordStrength)}
            </span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${getStrengthColor(passwordStrength)}`}
              style={{ width: `${passwordStrength}%` }}
            />
          </div>

          {/* Requirements checklist */}
          <div className="grid grid-cols-2 gap-1 pt-1">
            {passwordRequirements.map((req, i) => (
              <div key={i} className="flex items-center gap-1.5">
                {req.check ? (
                  <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                ) : (
                  <div className="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0" />
                )}
                <span className={`text-xs ${req.check ? 'text-green-600' : 'text-gray-500'
                  }`}>
                  {req.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {fieldErrors.password && (
        <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
      )}
    </div>

    {/* Confirm Password */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Confirm Password
      </label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          name="confirmPassword"
          type={showConfirmPassword ? 'text' : 'password'}
          value={signupData.confirmPassword}
          onChange={handleSignupChange}
          disabled={loading}
          className={`w-full pl-10 pr-10 py-2.5 rounded-lg border ${fieldErrors.confirmPassword
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-orange-500 focus:ring-orange-500'
            } focus:ring-2 focus:ring-opacity-20 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed`}
          placeholder="••••••••"
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={() => setShowConfirmPassword(p => !p)}
          disabled={loading}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
        >
          {showConfirmPassword ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>
      {fieldErrors.confirmPassword && (
        <p className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</p>
      )}
    </div>

    {/* Terms and conditions */}
    <div className="pt-2">
      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
          disabled={loading}
          className="mt-0.5 w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500 focus:ring-offset-0"
        />
        <span className="text-sm text-gray-600">
          I agree to the{' '}
          <button type="button" className="text-orange-600 hover:underline">
            Terms of Service
          </button>{' '}
          and{' '}
          <button type="button" className="text-orange-600 hover:underline">
            Privacy Policy
          </button>
        </span>
      </label>
      {fieldErrors.terms && (
        <p className="mt-1 text-xs text-red-600">{fieldErrors.terms}</p>
      )}
    </div>

    {/* Submit button */}
    <button
      type="submit"
      disabled={loading}
      className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Creating Account...
        </span>
      ) : (
        'Create Account'
      )}
    </button>

    {/* Switch to login */}
    <div className="mt-6 text-center text-sm">
      Already have an account?{' '}
      <button
        type="button"
        onClick={onSwitchToLogin}
        className="font-medium text-orange-600 hover:text-orange-700 hover:underline"
      >
        Sign in
      </button>
    </div>
  </form>
);

const ForgotPasswordForm = ({
  forgotPasswordData,
  handleForgotPasswordChange,
  handleForgotPasswordSubmit,
  fieldErrors,
  loading,
  onSwitchToLogin
}) => (
  <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
    <div className="mb-4">
      <p className="text-sm text-gray-600">
        Enter your email address and we'll send you a link to reset your password.
      </p>
    </div>

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
          value={forgotPasswordData.email}
          onChange={handleForgotPasswordChange}
          disabled={loading}
          className={`w-full pl-10 pr-3 py-2.5 rounded-lg border ${fieldErrors.email
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

    {/* Submit button */}
    <button
      type="submit"
      disabled={loading}
      className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Sending...
        </span>
      ) : (
        'Send Reset Link'
      )}
    </button>

    {/* Back to login */}
    <div className="text-center">
      <button
        type="button"
        onClick={onSwitchToLogin}
        className="text-sm text-orange-600 hover:text-orange-700 hover:underline"
      >
        ← Back to Sign In
      </button>
    </div>
  </form>
);

export default AuthModal;