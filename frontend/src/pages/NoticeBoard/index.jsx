import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, Users, Bell } from 'lucide-react';
import api from '../../utils/api';
import { useOutletContext } from 'react-router-dom';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

const NoticeBoard = () => {
  const { currentUser } = useOutletContext();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newNotice, setNewNotice] = useState({
    title: '',
    content: '',
    audience: 'ALL'
  });

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const response = await api.get('/notices');
      setNotices(response.data);
    } catch (error) {
      console.error('Failed to fetch notices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/notices', newNotice);
      setIsModalOpen(false);
      setNewNotice({ title: '', content: '', audience: 'ALL' });
      fetchNotices();
    } catch (error) {
      console.error('Failed to create notice:', error);
      alert('Failed to create notice');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;
    try {
      await api.delete(`/notices/${id}`);
      fetchNotices();
    } catch (error) {
      console.error('Failed to delete notice:', error);
      alert('Failed to delete notice');
    }
  };

  const canManage = ['admin', 'school_admin', 'teacher'].includes(currentUser?.role);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Notice Board</h1>
          <p className="text-gray-600">Important announcements and updates</p>
        </div>
        {canManage && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            Add Notice
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-10">Loading notices...</div>
      ) : notices.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <Bell size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-600">No notices found</h3>
          <p className="text-gray-500">Check back later for updates</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {notices.map((notice) => (
            <div key={notice.id} className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">{notice.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(notice.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-full text-xs font-medium">
                      <Users size={12} />
                      {notice.audience}
                    </span>
                  </div>
                </div>
                {canManage && (
                  <button
                    onClick={() => handleDelete(notice.id)}
                    className="text-gray-400 hover:text-red-500 p-1"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
              <p className="text-gray-600 whitespace-pre-wrap">{notice.content}</p>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Notice"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              required
              value={newNotice.title}
              onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Notice Title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
            <select
              value={newNotice.audience}
              onChange={(e) => setNewNotice({ ...newNotice, audience: e.target.value })}
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="ALL">All</option>
              <option value="STUDENTS">Students Only</option>
              <option value="TEACHERS">Teachers Only</option>
              <option value="PARENTS">Parents Only</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
            <textarea
              required
              rows={4}
              value={newNotice.content}
              onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })}
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              placeholder="Write your notice here..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Post Notice
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default NoticeBoard;
