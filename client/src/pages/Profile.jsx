// client/src/pages/Profile.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Settings,
  FileText,
  CreditCard,
  Bell,
  Shield,
  LogOut,
  CheckCircle,
  Edit2,
  Camera,
  ChevronRight,
  Star,
  Download,
  Calendar,
  Eye,
  EyeOff,
  X,
  Save,
  Upload,
  Key,
  Mail,
  Phone,
  MapPin,
  Award,
  BarChart,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
  Trash2
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth'; // or use your AuthContext
import api from '../services/api';

const Profile = () => {
  const { user, logout, updateUser } = useAuth(); // Assuming your auth hook provides these
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  // Dynamic user data - initially populated from auth context
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    avatarUrl: '',
    subscription: {
      plan: 'Free',
      status: 'active',
      expiresAt: null,
      reportsUsed: 0,
      reportsTotal: 3 // Default for free plan
    },
    notifications: {
      email: true,
      reportReady: true,
      promotional: false,
      reminders: true
    },
    security: {
      twoFactor: false,
      lastLogin: new Date().toLocaleString(),
      devices: []
    }
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Initialize with user data from auth context
  useEffect(() => {
    if (user) {
      setUserData(prev => ({
        ...prev,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        avatarUrl: user.avatarUrl || '',
        subscription: user.subscription || prev.subscription
      }));
    }
  }, [user]);

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: <User className="w-4 h-4" /> },
    { id: 'subscription', label: 'Subscription', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'reports', label: 'My Reports', icon: <FileText className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> }
  ];

  const [reports, setReports] = useState([]);

  // Fetch user reports
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await api.get('/jobs');
        setReports(response.data.data || []);
      } catch (err) {
        console.error('Error fetching reports:', err);
      }
    };

    if (activeTab === 'reports') {
      fetchReports();
    }
  }, [activeTab]);

  // Handle profile picture upload
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image (JPEG, PNG, GIF, or WebP)');
      return;
    }

    if (file.size > maxSize) {
      setError('Image size should be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setUploadingImage(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await api.post('/users/me/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        // Update local state
        setUserData(prev => ({
          ...prev,
          avatarUrl: response.data.avatarUrl
        }));

        // Update auth context if available
        if (updateUser) {
          updateUser({ avatarUrl: response.data.avatarUrl });
        }

        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload image');
      console.error('Upload error:', err);
    } finally {
      setUploadingImage(false);
    }
  };

  // Remove profile picture
  const handleRemoveImage = async () => {
    if (!window.confirm('Are you sure you want to remove your profile picture?')) return;

    try {
      setUploadingImage(true);
      setError(null);
      const response = await api.delete('/users/me/avatar');

      if (response.data?.success) {
        setUserData(prev => ({
          ...prev,
          avatarUrl: ''
        }));

        if (updateUser) {
          updateUser({ avatarUrl: '' });
        }

        setImagePreview(null);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to remove image');
      console.error('Remove avatar error:', err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!isEditing) return;

    setLoading(true);
    setError(null);

    try {
      // Parse name into first and last name
      const nameParts = userData.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const updateData = {
        firstName,
        lastName,
        phone: userData.phone,
        address: userData.address
      };

      const response = await api.put('/user/profile', updateData);

      if (response.data.success) {
        // Update auth context
        if (updateUser) {
          updateUser({
            firstName,
            lastName,
            phone: userData.phone,
            address: userData.address
          });
        }

        setIsEditing(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.put('/user/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (response.data.success) {
        setShowChangePassword(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    // Optional: Redirect to home
    // navigate('/');
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you absolutely sure? This cannot be undone!')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.delete('/user/account');

      if (response.data.success) {
        logout();
        // Optional: Show success message or redirect
        window.location.href = '/';
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete account');
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  const calculateProgress = () => {
    if (!userData.subscription.reportsTotal) return 0;
    return (userData.subscription.reportsUsed / userData.subscription.reportsTotal) * 100;
  };

  const getAvatarInitials = () => {
    if (!userData.name) return 'U';
    const names = userData.name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  const getSubscriptionData = () => {
    const plan = userData.subscription?.plan || 'Free';
    const plans = {
      'Free': { price: '0', reportsTotal: 3, color: 'from-gray-500 to-gray-600' },
      'Standard': { price: '7.99', reportsTotal: 10, color: 'from-orange-500 to-amber-600' },
      'Premium': { price: '9.99', reportsTotal: 50, color: 'from-gray-800 to-gray-900' }
    };

    return plans[plan] || plans['Free'];
  };

  // Render functions for each tab (only showing updated personal info tab for brevity)
  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return (
          <div className="space-y-8">
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="font-medium text-red-800">Error</p>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Success Message */}
            {showSuccess && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl mb-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Profile updated successfully!</p>
                    <p className="text-sm text-green-700">Your changes have been saved.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative group">
                  {userData.avatarUrl || imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview || userData.avatarUrl}
                        alt={userData.name}
                        className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                      <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-amber-600 rounded-full flex items-center justify-center text-white font-bold text-2xl relative group">
                      {getAvatarInitials()}
                      <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  )}

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />

                  <div className="absolute bottom-0 right-0 flex gap-1">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Change photo"
                    >
                      {uploadingImage ? (
                        <Loader2 className="w-4 h-4 text-gray-600 animate-spin" />
                      ) : (
                        <Camera className="w-4 h-4 text-gray-600" />
                      )}
                    </button>

                    {(userData.avatarUrl || imagePreview) && (
                      <button
                        onClick={handleRemoveImage}
                        disabled={uploadingImage}
                        className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-colors disabled:opacity-50"
                        title="Remove photo"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{userData.name || 'User'}</h2>
                  <p className="text-gray-600">{userData.email || 'No email provided'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium capitalize">
                      {user?.subscription?.tier || 'Free'} Member
                    </div>
                    <div className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                disabled={loading}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Edit2 className="w-4 h-4" />
                {isEditing ? 'Cancel Editing' : 'Edit Profile'}
              </button>
            </div>

            {/* Upload Progress */}
            {uploadingImage && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-800">Uploading image...</p>
                    <p className="text-sm text-blue-700">Please wait while we upload your profile picture</p>
                  </div>
                </div>
              </div>
            )}

            {/* Personal Information Form */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-6 text-gray-900">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={userData.name}
                      onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-lg flex items-center gap-3">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-900">{userData.name || 'Not set'}</span>
                    </div>
                  )}
                </div>

                {/* Email Field (read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="px-4 py-3 bg-gray-50 rounded-lg flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-900">{userData.email || 'No email'}</span>
                    <span className="ml-auto px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">
                      Cannot change
                    </span>
                  </div>
                </div>

                {/* Phone Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={userData.phone}
                      onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                      placeholder="+61 412 345 678"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-lg flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-900">{userData.phone || 'Not set'}</span>
                    </div>
                  )}
                </div>

                {/* Address Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={userData.address}
                      onChange={(e) => setUserData({ ...userData, address: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                      placeholder="123 Main Street, Sydney NSW 2000"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-lg flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-900">{userData.address || 'Not set'}</span>
                    </div>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="mt-8 flex justify-end gap-3">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-orange-500/30 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Account Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Password & Security</h3>
                <p className="text-gray-600 mb-6">Update your password and manage security settings</p>
                <button
                  onClick={() => setShowChangePassword(true)}
                  className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg font-medium transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Key className="w-4 h-4" />
                    <span>Change Password</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-red-200 p-6">
                <h3 className="text-lg font-semibold mb-4 text-red-700">Danger Zone</h3>
                <p className="text-gray-600 mb-6">Permanently delete your account and all data</p>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full px-4 py-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-medium transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <X className="w-4 h-4" />
                    <span>Delete Account</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );

      case 'subscription':
        return (
          <div className="space-y-8">
            {/* Current Plan Card */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-200 p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-orange-700 font-semibold uppercase text-sm">Your Plan</p>
                  <h2 className="text-3xl font-bold text-gray-900 mt-2">{userData.subscription?.plan || 'Free'}</h2>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900">
                    ${getSubscriptionData().price}
                    <span className="text-lg text-gray-600">/month</span>
                  </p>
                </div>
              </div>

              <p className="text-gray-700 mb-6">
                Manage your subscription plan, view billing history, and update payment methods.
              </p>

              <button className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-orange-500/30 transition-all">
                Upgrade Plan
              </button>
            </div>

            {/* Reports Usage */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-6 text-gray-900">Reports Usage</h3>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-700 font-medium">
                    {userData.subscription?.reportsUsed || 0} of {userData.subscription?.reportsTotal || 3} reports used
                  </span>
                  <span className="text-orange-600 font-semibold">
                    {Math.round((userData.subscription?.reportsUsed || 0) / (userData.subscription?.reportsTotal || 3) * 100)}%
                  </span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-amber-600 h-full transition-all duration-500"
                    style={{ width: `${calculateProgress()}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 text-sm">Reports Used</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{userData.subscription?.reportsUsed || 0}</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 text-sm">Remaining</p>
                  <p className="text-2xl font-bold text-orange-600 mt-2">
                    {(userData.subscription?.reportsTotal || 3) - (userData.subscription?.reportsUsed || 0)}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 text-sm">Total Quota</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{userData.subscription?.reportsTotal || 3}</p>
                </div>
              </div>
            </div>

            {/* Plan Features */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-6 text-gray-900">Plan Features</h3>

              <div className="space-y-4">
                {[
                  { feature: 'Document Analysis', included: true },
                  { feature: 'Basic Reports', included: true },
                  { feature: 'Email Support', included: true },
                  { feature: 'Advanced Analytics', included: userData.subscription?.plan !== 'Free' },
                  { feature: 'Priority Support', included: userData.subscription?.plan === 'Premium' },
                  { feature: 'API Access', included: userData.subscription?.plan === 'Premium' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className={`w-5 h-5 rounded flex items-center justify-center ${item.included ? 'bg-green-100' : 'bg-gray-100'}`}>
                      {item.included ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <X className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <span className={item.included ? 'text-gray-900 font-medium' : 'text-gray-500'}>{item.feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Billing History */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-6 text-gray-900">Billing History</h3>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Invoice</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-900">Dec 1, 2024</td>
                      <td className="py-3 px-4 text-gray-900">${getSubscriptionData().price}</td>
                      <td className="py-3 px-4">
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Paid</span>
                      </td>
                      <td className="py-3 px-4">
                        <button className="text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1">
                          <Download className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'reports':
        return (
          <div className="space-y-8">
            {/* Reports Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <p className="text-gray-600 text-sm font-medium">Total Reports</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{reports.length}</p>
                <p className="text-xs text-gray-500 mt-2">Generated analysis reports</p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <p className="text-gray-600 text-sm font-medium">Completed</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {reports.filter(r => r.status === 'completed').length}
                </p>
                <p className="text-xs text-gray-500 mt-2">Ready to download</p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <p className="text-gray-600 text-sm font-medium">Processing</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {reports.filter(r => r.status === 'processing').length}
                </p>
                <p className="text-xs text-gray-500 mt-2">Being analyzed</p>
              </div>
            </div>

            {/* Recent Reports */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-6 text-gray-900">Recent Reports</h3>

              {reports.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No reports yet. Start by uploading a document.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.slice(0, 5).map(report => (
                    <div key={report._id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-200 last:border-0">
                      <div className="flex items-center gap-3 flex-1">
                        <FileText className="w-5 h-5 text-orange-600" />
                        <div>
                          <p className="font-medium text-gray-900">{report.title || 'Untitled'}</p>
                          <p className="text-sm text-gray-500">{new Date(report.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${report.status === 'completed' ? 'bg-green-100 text-green-800' :
                          report.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                          {report.status || 'Pending'}
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {reports.length > 5 && (
                <button className="w-full mt-6 py-3 text-orange-600 hover:bg-orange-50 rounded-lg font-medium transition-colors">
                  View All Reports
                </button>
              )}
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-6 text-gray-900">Notification Preferences</h3>

              <div className="space-y-4">
                {[
                  { label: 'Email Notifications', description: 'Receive notifications via email' },
                  { label: 'Report Ready', description: 'Get notified when your analysis reports are ready' },
                  { label: 'Security Alerts', description: 'Important security and account alerts' },
                  { label: 'Weekly Digest', description: 'Summary of your weekly activity' },
                  { label: 'Product Updates', description: 'New features and improvements' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-200 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    </div>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-orange-600">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors">
                  Reset to Default
                </button>
                <button className="px-6 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-orange-500/30 transition-all">
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        );



      default:
        return null;
    }
  };

  // Updated modals for password change and delete account
  const renderModals = () => (
    <>
      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Change Password</h3>
              <button
                onClick={() => setShowChangePassword(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={loading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all disabled:bg-gray-50"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowChangePassword(false);
                  setError(null);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordChange}
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-orange-500/30 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Account</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.
              </p>
              <p className="text-sm text-red-600 mb-6 font-medium">
                Warning: This will delete all your reports and data permanently!
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={loading}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Account'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Loading profile...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              {/* User Summary */}
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
                {userData.avatarUrl ? (
                  <img
                    src={userData.avatarUrl}
                    alt={userData.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {getAvatarInitials()}
                  </div>
                )}
                <div>
                  <div className="font-semibold text-gray-900">{userData.name || 'User'}</div>
                  <div className="text-sm text-gray-500">{userData.email || 'No email'}</div>
                </div>
              </div>

              {/* Tabs */}
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    disabled={loading}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === tab.id
                      ? 'bg-orange-50 text-orange-600'
                      : 'text-gray-600 hover:bg-gray-50'
                      } disabled:opacity-50`}
                  >
                    {tab.icon}
                    <span className="font-medium">{tab.label}</span>
                    {activeTab === tab.id && (
                      <div className="ml-auto w-2 h-2 bg-orange-500 rounded-full"></div>
                    )}
                  </button>
                ))}
              </nav>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                disabled={loading}
                className="w-full mt-8 flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>

            {/* Quick Stats */}
            <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Reports Used</span>
                  <span className="font-semibold text-gray-900">
                    {userData.subscription.reportsUsed}/{userData.subscription.reportsTotal}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Plan</span>
                  <span className="font-semibold text-orange-600">{userData.subscription.plan}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Member Since</span>
                  <span className="font-semibold text-gray-900">
                    {user?.createdAt ? new Date(user.createdAt).getFullYear() : '2024'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {renderTabContent()}
          </div>
        </div>
      </div>

      {renderModals()}
    </div>
  );
};

export default Profile;