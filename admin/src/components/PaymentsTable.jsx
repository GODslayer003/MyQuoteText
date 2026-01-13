// admin/src/components/PaymentsTable.jsx
import React, { useState } from 'react';
import { CreditCard, ChevronRight, Loader2, DollarSign, Calendar, MoreVertical, User } from 'lucide-react';

const PaymentsTable = ({ payments, loading }) => {
  const [expandedId, setExpandedId] = useState(null);

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'succeeded':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      case 'partially_refunded':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'free':
        return 'bg-gray-100 text-gray-800';
      case 'standard':
        return 'bg-blue-100 text-blue-800';
      case 'premium':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
          <CreditCard className="w-5 h-5 text-orange-600" />
          Recent Payments
        </h2>
        <button className="px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg font-medium transition-colors">
          View All
        </button>
      </div>

      {loading && payments.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-12">
          <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No payments found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-4 px-4 font-semibold text-gray-700">Transaction ID</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700">User</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700">Amount</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700">Tier</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700">Date</th>
                <th className="text-center py-4 px-4 font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => (
                <React.Fragment key={payment._id}>
                  <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <p className="font-mono text-xs text-gray-500">{payment.stripePaymentId || payment._id}</p>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="w-3 h-3 text-gray-500" />
                        </div>
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">
                            {payment.userId?.firstName
                              ? `${payment.userId.firstName} ${payment.userId.lastName || ''}`
                              : 'Unknown User'}
                          </p>
                          <p className="text-xs text-gray-500">{payment.userId?.email || 'No email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <p className="font-semibold text-gray-900">{payment.amount?.toFixed(2) || '0.00'}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getTierColor(payment.tier)}`}>
                        {payment.tier || 'N/A'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(payment.status)}`}>
                        {payment.status?.replace('_', ' ') || 'pending'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDate(payment.createdAt)}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => setExpandedId(expandedId === payment._id ? null : payment._id)}
                        className="inline-flex items-center justify-center w-8 h-8 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-600" />
                      </button>
                    </td>
                  </tr>
                  {expandedId === payment._id && (
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <td colSpan="6" className="py-4 px-4">
                        <div className="space-y-3">
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-xs text-gray-600 uppercase font-semibold">User Details</p>
                              <p className="text-gray-900 mt-1 font-medium">
                                {payment.userId?.firstName
                                  ? `${payment.userId.firstName} ${payment.userId.lastName || ''}`
                                  : 'N/A'}
                              </p>
                              <p className="text-sm text-gray-500">{payment.userId?.email}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 uppercase font-semibold">Currency</p>
                              <p className="text-gray-900 mt-1 uppercase">{payment.currency || 'usd'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 uppercase font-semibold">Payment Method</p>
                              <p className="text-gray-900 mt-1 capitalize">{payment.paymentMethod || 'stripe'}</p>
                            </div>
                          </div>
                          {payment.refundAmount && (
                            <div>
                              <p className="text-xs text-gray-600 uppercase font-semibold">Refund Amount</p>
                              <p className="text-gray-900 mt-1">${payment.refundAmount?.toFixed(2)}</p>
                            </div>
                          )}
                          <div className="flex gap-2 pt-4 border-t border-gray-200">
                            <button className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors">
                              View Receipt
                            </button>
                            {payment.status === 'succeeded' && (
                              <button className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-sm font-medium transition-colors">
                                Issue Refund
                              </button>
                            )}
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
      )
      }
    </div >
  );
};

export default PaymentsTable;
