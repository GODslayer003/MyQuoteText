// admin/src/components/UsersTable.jsx
import React, { useState } from 'react';
import { Users, ChevronRight, Loader2, Mail, Phone, Calendar, MoreVertical } from 'lucide-react';

const UsersTable = ({ users, loading }) => {
  const [expandedId, setExpandedId] = useState(null);

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
          <Users className="w-5 h-5 text-orange-600" />
          Recent Users
        </h2>
        <button className="px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg font-medium transition-colors">
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
                      <span className={`px-2 py-1 rounded-md text-xs font-semibold ${user.subscription?.plan === 'Professional' ? 'bg-blue-100 text-blue-700' :
                          user.subscription?.plan === 'Enterprise' ? 'bg-purple-100 text-purple-700' :
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
        </div>
      )}
    </div>
  );
};

export default UsersTable;
