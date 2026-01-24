// admin/src/components/UsersTable.jsx
import React, { useState } from 'react';
import { Users, ChevronRight, Loader2, Mail, Phone, Calendar, MoreVertical, X, User } from 'lucide-react';
import api from '../services/api';

const UsersTable = ({ users, loading, pagination, onPageChange }) => {
  const [expandedId, setExpandedId] = useState(null);
  const [viewAllOpen, setViewAllOpen] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [loadingAll, setLoadingAll] = useState(false);

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleViewAll = async () => {
    setViewAllOpen(true);
    setLoadingAll(true);
    try {
      const response = await api.get('/admin/users', { params: { limit: 100 } });
      setAllUsers(response.data.data);
    } catch (err) {
      console.error('Failed to fetch all users:', err);
    } finally {
      setLoadingAll(false);
    }
  };

  const renderPagination = () => {
    if (!pagination || pagination.total <= pagination.limit) return null;
    const totalPages = Math.ceil(pagination.total / pagination.limit);
    const pages = [];
    for (let i = 1; i <= Math.min(totalPages, 5); i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center gap-2 mt-4">
        {pages.map(p => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${p === pagination.page
              ? 'bg-orange-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            {p}
          </button>
        ))}
        {totalPages > 5 && <span className="text-gray-400">...</span>}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
          <Users className="w-5 h-5 text-orange-600" />
          Recent Users
        </h2>
        <button
          onClick={handleViewAll}
          className="px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg font-medium transition-colors"
        >
          View All
        </button>
      </div>

      {loading && users.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No users found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-4 px-4 font-semibold text-gray-700">Name</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700">Email</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700">Plan</th>
                <th className="text-center py-4 px-4 font-semibold text-gray-700">Jobs</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700">Joined</th>
                <th className="text-center py-4 px-4 font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <React.Fragment key={user._id}>
                  <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                          {(user.firstName?.[0] || user.email?.[0] || 'U').toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{user._id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-gray-900">{user.email}</p>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.accountStatus === 'active'
                        ? 'bg-green-100 text-green-800'
                        : user.accountStatus === 'suspended'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                        }`}>
                        {user.accountStatus || 'active'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-semibold ${user.subscription?.plan === 'Standard' ? 'bg-blue-100 text-blue-700' :
                        user.subscription?.plan === 'Premium' ? 'bg-purple-100 text-purple-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                        {user.subscription?.plan || 'Free'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="font-mono text-gray-700 font-medium">{user.jobCount || 0}</span>
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDate(user.createdAt)}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => setExpandedId(expandedId === user._id ? null : user._id)}
                        className="inline-flex items-center justify-center w-8 h-8 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-600" />
                      </button>
                    </td>
                  </tr>
                  {expandedId === user._id && (
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <td colSpan="7" className="py-4 px-4">
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-600 uppercase font-semibold">Phone</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <p className="text-gray-900">{user.phone || 'Not provided'}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 uppercase font-semibold">Email Verified</p>
                              <p className="text-gray-900 mt-1">
                                {user.emailVerified ? '✓ Yes' : '✗ No'}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 pt-4 border-t border-gray-200">
                            <button className="px-3 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-sm font-medium transition-colors">
                              View Details
                            </button>
                            <button className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm font-medium transition-colors">
                              Suspend
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          {renderPagination()}
        </div>
      )}

      {/* View All Modal */}
      {viewAllOpen && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Users className="w-6 h-6 text-orange-600" />
                All Users ({pagination?.total || 0})
              </h3>
              <button
                onClick={() => setViewAllOpen(false)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-300">
              {loadingAll ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
                  <p className="text-gray-500">Retrieving full user database...</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="border-b border-gray-200 text-left">
                      <th className="py-3 px-4 text-xs font-bold text-gray-400 uppercase">User</th>
                      <th className="py-3 px-4 text-xs font-bold text-gray-400 uppercase">Email</th>
                      <th className="py-3 px-4 text-xs font-bold text-gray-400 uppercase">Tier</th>
                      <th className="py-3 px-4 text-xs font-bold text-gray-400 uppercase">Status</th>
                      <th className="py-3 px-4 text-xs font-bold text-gray-400 uppercase">Registered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {allUsers.map(u => (
                      <tr key={u._id} className="hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                              {u.firstName?.[0] || 'U'}
                            </div>
                            <span className="font-medium">{u.firstName} {u.lastName}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-600">{u.email}</td>
                        <td className="py-4 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter bg-gray-100 text-gray-500">
                            {u.subscription?.plan || 'Free'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="w-2 h-2 rounded-full bg-green-500 inline-block mr-2"></span>
                          <span className="text-sm capitalize">{u.accountStatus || 'active'}</span>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-500">{formatDate(u.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 text-right">
              <button
                onClick={() => setViewAllOpen(false)}
                className="px-6 py-2 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors"
              >
                Close Portal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersTable;
