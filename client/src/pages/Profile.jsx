// client/src/pages/Profile.jsx
import React, { useState } from 'react';
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
  BarChart
} from 'lucide-react';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Mock user data - Replace with actual user data from context/API
  const [userData, setUserData] = useState({
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '+61 412 345 678',
    address: '123 Main Street, Sydney NSW 2000',
    avatarInitials: 'JS',
    subscription: {
      plan: 'Professional',
      status: 'active',
      expiresAt: '2024-12-31',
      reportsUsed: 3,
      reportsTotal: 10
    },
    notifications: {
      email: true,
      reportReady: true,
      promotional: false,
      reminders: true
    },
    security: {
      twoFactor: false,
      lastLogin: '2024-03-15 14:30',
      devices: [
        { device: 'Chrome on MacBook Pro', lastUsed: '2024-03-15' },
        { device: 'iPhone Safari', lastUsed: '2024-03-14' }
      ]
    }
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: <User className="w-4 h-4" /> },
    { id: 'subscription', label: 'Subscription', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'reports', label: 'My Reports', icon: <FileText className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> }
  ];

  const reports = [
    { id: 1, name: 'Kitchen Renovation', date: '2024-03-10', status: 'completed', amount: '$7.99' },
    { id: 2, name: 'Bathroom Remodel', date: '2024-03-05', status: 'completed', amount: '$7.99' },
    { id: 3, name: 'Deck Construction', date: '2024-02-28', status: 'processing', amount: '$9.99' },
    { id: 4, name: 'Roof Replacement', date: '2024-02-20', status: 'completed', amount: '$7.99' }
  ];

  const handleSaveProfile = () => {
    // In production, this would call your API
    setIsEditing(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handlePasswordChange = () => {
    // In production, this would call your API
    setShowChangePassword(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleLogout = () => {
    // Implement your logout logic here
    console.log('Logging out...');
    // navigate('/login');
  };

  const handleDeleteAccount = () => {
    // Implement delete account logic here
    console.log('Deleting account...');
    setShowDeleteModal(false);
  };

  const calculateProgress = () => {
    return (userData.subscription.reportsUsed / userData.subscription.reportsTotal) * 100;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return (
          <div className="space-y-8">
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
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-amber-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                    {userData.avatarInitials}
                  </div>
                  <button className="absolute bottom-0 right-0 w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors">
                    <Camera className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{userData.name}</h2>
                  <p className="text-gray-600">{userData.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                      {userData.subscription.plan} Member
                    </div>
                    <div className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      Member since 2024
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                {isEditing ? 'Cancel Editing' : 'Edit Profile'}
              </button>
            </div>

            {/* Personal Information Form */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-6 text-gray-900">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-lg flex items-center gap-3">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-900">{userData.name}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={userData.email}
                      onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-lg flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-900">{userData.email}</span>
                    </div>
                  )}
                </div>

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
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-lg flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-900">{userData.phone}</span>
                    </div>
                  )}
                </div>

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
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-lg flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-900">{userData.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="mt-8 flex justify-end">
                  <button
                    onClick={handleSaveProfile}
                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-orange-500/30 transition-all flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
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
            {/* Current Plan */}
            <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-2xl p-6 text-white">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{userData.subscription.plan} Plan</h2>
                  <p className="opacity-90">Active until {userData.subscription.expiresAt}</p>
                  <div className="flex items-center gap-2 mt-4">
                    <Award className="w-5 h-5" />
                    <span className="font-medium">All features unlocked</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">${userData.subscription.plan === 'Professional' ? '7.99' : '9.99'}</div>
                  <div className="opacity-90">per report</div>
                  <button className="mt-4 px-6 py-2 bg-white text-orange-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                    Manage Subscription
                  </button>
                </div>
              </div>
            </div>

            {/* Reports Usage */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Reports Usage</h3>
                  <p className="text-gray-600">Your report usage for this billing period</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {userData.subscription.reportsUsed} / {userData.subscription.reportsTotal}
                  </div>
                  <div className="text-gray-600">Reports used</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-600 rounded-full transition-all duration-500"
                    style={{ width: `${calculateProgress()}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  <span>0 reports</span>
                  <span>{userData.subscription.reportsTotal} reports</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="text-2xl font-bold text-gray-900">{userData.subscription.reportsUsed}</div>
                  <div className="text-gray-600">Used</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="text-2xl font-bold text-gray-900">
                    {userData.subscription.reportsTotal - userData.subscription.reportsUsed}
                  </div>
                  <div className="text-gray-600">Remaining</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="text-2xl font-bold text-gray-900">
                    ${userData.subscription.plan === 'Professional' ? '7.99' : '9.99'}
                  </div>
                  <div className="text-gray-600">Per report</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="text-2xl font-bold text-gray-900">30 days</div>
                  <div className="text-gray-600">Access period</div>
                </div>
              </div>
            </div>

            {/* Plan Comparison */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-6 text-gray-900">Available Plans</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border border-gray-200 rounded-xl p-6">
                  <div className="text-center mb-4">
                    <div className="text-xl font-bold text-gray-900 mb-2">Explorer</div>
                    <div className="text-3xl font-bold text-gray-900">Free</div>
                    <div className="text-gray-600">Basic analysis</div>
                  </div>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center gap-2 text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Basic AI summary</span>
                    </li>
                    <li className="flex items-center gap-2 text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Red flag detection</span>
                    </li>
                  </ul>
                  <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                    Current Plan
                  </button>
                </div>

                <div className="border-2 border-orange-500 rounded-xl p-6 bg-orange-50">
                  <div className="text-center mb-4">
                    <div className="text-xl font-bold text-gray-900 mb-2">Professional</div>
                    <div className="text-3xl font-bold text-gray-900">$7.99</div>
                    <div className="text-gray-600">per report</div>
                  </div>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center gap-2 text-gray-700">
                      <CheckCircle className="w-4 h-4 text-orange-500" />
                      <span>Complete AI analysis</span>
                    </li>
                    <li className="flex items-center gap-2 text-gray-700">
                      <CheckCircle className="w-4 h-4 text-orange-500" />
                      <span>Detailed PDF report</span>
                    </li>
                  </ul>
                  <button className="w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-orange-500/30 transition-all">
                    {userData.subscription.plan === 'Professional' ? 'Current Plan' : 'Upgrade Now'}
                  </button>
                </div>

                <div className="border border-gray-200 rounded-xl p-6">
                  <div className="text-center mb-4">
                    <div className="text-xl font-bold text-gray-900 mb-2">Enterprise</div>
                    <div className="text-3xl font-bold text-gray-900">$9.99</div>
                    <div className="text-gray-600">per report</div>
                  </div>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center gap-2 text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Multiple quote comparison</span>
                    </li>
                    <li className="flex items-center gap-2 text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Market benchmarking</span>
                    </li>
                  </ul>
                  <button className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-semibold transition-colors">
                    {userData.subscription.plan === 'Enterprise' ? 'Current Plan' : 'Upgrade Now'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'reports':
        return (
          <div className="space-y-8">
            {/* Reports Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">My Reports</h2>
                <p className="text-gray-600">View and manage all your quote analyses</p>
              </div>
              <Link
                to="/check-quote"
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-orange-500/30 transition-all flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Analyze New Quote
              </Link>
            </div>

            {/* Reports Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="text-2xl font-bold text-gray-900">{reports.length}</div>
                <div className="text-gray-600">Total Reports</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="text-2xl font-bold text-gray-900">
                  ${reports.filter(r => r.status === 'completed').length * 7.99}
                </div>
                <div className="text-gray-600">Total Spent</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="text-2xl font-bold text-green-600">
                  ${reports.filter(r => r.status === 'completed').length * 1500}
                </div>
                <div className="text-gray-600">Estimated Savings</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="text-2xl font-bold text-gray-900">4.9</div>
                <div className="text-gray-600 flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                </div>
              </div>
            </div>

            {/* Reports Table */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-900">Report Name</th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-900">Date</th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-900">Status</th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-900">Amount</th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reports.map((report) => (
                      <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-medium text-gray-900">{report.name}</div>
                          <div className="text-sm text-gray-600">Quote Analysis Report</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700">{report.date}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${report.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {report.status === 'completed' ? 'Completed' : 'Processing'}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-medium text-gray-900">{report.amount}</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <button className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors">
                              <Download className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* No Reports State */}
            {reports.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Reports Yet</h3>
                <p className="text-gray-600 mb-6">Upload your first quote to get started with analysis</p>
                <Link
                  to="/check-quote"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-orange-500/30 transition-all"
                >
                  Analyze Your First Quote
                </Link>
              </div>
            )}
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-6 text-gray-900">Notification Preferences</h3>
              <div className="space-y-6">
                {Object.entries(userData.notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 capitalize">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </div>
                      <div className="text-sm text-gray-600">
                        {key === 'email' && 'Receive email notifications'}
                        {key === 'reportReady' && 'Get notified when reports are ready'}
                        {key === 'promotional' && 'Receive promotional offers and updates'}
                        {key === 'reminders' && 'Get reminder emails about your subscription'}
                      </div>
                    </div>
                    <button
                      onClick={() => setUserData({
                        ...userData,
                        notifications: { ...userData.notifications, [key]: !value }
                      })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-orange-600' : 'bg-gray-300'
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-6 text-gray-900">Security Settings</h3>
              
              {/* Two-Factor Authentication */}
              <div className="flex items-center justify-between mb-8 pb-8 border-b border-gray-200">
                <div>
                  <div className="font-medium text-gray-900">Two-Factor Authentication</div>
                  <div className="text-sm text-gray-600">Add an extra layer of security to your account</div>
                </div>
                <button
                  onClick={() => setUserData({
                    ...userData,
                    security: { ...userData.security, twoFactor: !userData.security.twoFactor }
                  })}
                  className={`px-4 py-2 rounded-lg font-medium ${userData.security.twoFactor
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } transition-colors`}
                >
                  {userData.security.twoFactor ? 'Disable' : 'Enable'}
                </button>
              </div>

              {/* Recent Activity */}
              <div>
                <div className="font-medium text-gray-900 mb-4">Recent Activity</div>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-900">Last Login</div>
                    <div className="text-sm text-gray-600">{userData.security.lastLogin}</div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-900 mb-2">Active Devices</div>
                    {userData.security.devices.map((device, index) => (
                      <div key={index} className="flex items-center justify-between py-2">
                        <div className="text-sm text-gray-600">{device.device}</div>
                        <div className="text-sm text-gray-500">Last used: {device.lastUsed}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Modals
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
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={() => setShowChangePassword(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordChange}
                className="px-6 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-orange-500/30 transition-all"
              >
                Update Password
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
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

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
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {userData.avatarInitials}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{userData.name}</div>
                  <div className="text-sm text-gray-500">{userData.email}</div>
                </div>
              </div>

              {/* Tabs */}
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === tab.id
                        ? 'bg-orange-50 text-orange-600'
                        : 'text-gray-600 hover:bg-gray-50'
                      }`}
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
                className="w-full mt-8 flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                  <span className="font-semibold text-gray-900">2024</span>
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