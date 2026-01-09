import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Calendar, CheckCircle, XCircle, Clock, Plus, Filter } from 'lucide-react';
import api from '../../utils/api';

const Leaves = () => {
  const { currentUser } = useOutletContext();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'full_day',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const [reasonCategory, setReasonCategory] = useState('');

  const LEAVE_REASONS = [
    "Sick Leave / Medical Emergency",
    "Family Function / Event",
    "Out of Station / Travel",
    "Personal Reason",
    "Urgent Piece of Work",
    "Festival Celebration",
    "Other"
  ];

  const isStudent = currentUser?.role === 'student';
  const isParent = currentUser?.role === 'parent';
  const isAdmin = ['admin', 'school_admin'].includes(currentUser?.role);

  useEffect(() => {
    fetchLeaves();
  }, []);

  useEffect(() => {
    if (reasonCategory && reasonCategory !== 'Other') {
      setFormData(prev => ({ ...prev, reason: reasonCategory }));
    } else if (reasonCategory === 'Other' && formData.reason === LEAVE_REASONS[0]) {
       // Clear reason if switching to Other from a preset
       setFormData(prev => ({ ...prev, reason: '' }));
    }
  }, [reasonCategory]);

  const fetchLeaves = async () => {
    try {
      const response = await api.get('/leaves');
      setLeaves(response.data);
    } catch (error) {
      console.error('Failed to fetch leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    try {
      await api.post('/leaves', formData);
      setShowApplyModal(false);
      fetchLeaves();
      alert('Leave application submitted successfully!');
    } catch (error) {
      alert('Failed to apply for leave');
    }
  };

  const handleParentApprove = async (id) => {
    try {
      await api.post(`/leaves/${id}/approve-parent`);
      fetchLeaves();
    } catch (error) {
      alert('Failed to approve leave');
    }
  };

  const handleAdminApprove = async (id, status) => {
    try {
      const comment = prompt('Add a comment (optional):');
      await api.post(`/leaves/${id}/approve-admin`, { status, adminComment: comment });
      fetchLeaves();
    } catch (error) {
      alert(`Failed to ${status} leave`);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending_parent: 'bg-yellow-100 text-yellow-800',
      pending_school: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Leave Management</h1>
          <p className="text-gray-500">Track and manage leave applications</p>
        </div>
        {isStudent && (
          <button
            onClick={() => setShowApplyModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            <Plus size={20} /> Apply Leave
          </button>
        )}
      </div>

      {showApplyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Apply for Leave</h2>
            <form onSubmit={handleApply} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Leave Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full border rounded-lg p-2"
                >
                  <option value="full_day">Full Day</option>
                  <option value="half_day">Half Day (Gate Pass)</option>
                  <option value="sick">Sick Leave</option>
                  <option value="casual">Casual Leave</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reason</label>
                <select
                  value={reasonCategory}
                  onChange={(e) => {
                    setReasonCategory(e.target.value);
                    if (e.target.value !== 'Other') {
                      setFormData({ ...formData, reason: e.target.value });
                    } else {
                      setFormData({ ...formData, reason: '' });
                    }
                  }}
                  className="w-full border rounded-lg p-2 mb-2"
                  required
                >
                  <option value="" disabled>Select a reason</option>
                  {LEAVE_REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                
                {reasonCategory === 'Other' && (
                  <textarea
                    required
                    placeholder="Please specify your reason..."
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    className="w-full border rounded-lg p-2"
                    rows={3}
                  />
                )}
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gate Pass</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {leaves.map((leave) => (
              <tr key={leave.id}>
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium text-gray-900">
                      {leave.student?.user?.firstName} {leave.student?.user?.lastName}
                    </div>
                    <div className="text-xs text-gray-500">ID: {leave.student?.userId}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="capitalize">{leave.type.replace('_', ' ')}</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={leave.reason}>
                  {leave.reason}
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(leave.status)}
                </td>
                <td className="px-6 py-4 font-mono text-sm">
                  {leave.gatePassCode || '-'}
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  {isParent && leave.status === 'pending_parent' && (
                    <button
                      onClick={() => handleParentApprove(leave.id)}
                      className="text-green-600 hover:text-green-800 font-medium text-sm"
                    >
                      Approve
                    </button>
                  )}
                  {isAdmin && leave.status === 'pending_school' && (
                    <>
                      <button
                        onClick={() => handleAdminApprove(leave.id, 'approved')}
                        className="text-green-600 hover:text-green-800 p-1"
                        title="Approve"
                      >
                        <CheckCircle size={18} />
                      </button>
                      <button
                        onClick={() => handleAdminApprove(leave.id, 'rejected')}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Reject"
                      >
                        <XCircle size={18} />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {leaves.length === 0 && (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                  No leave records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leaves;
