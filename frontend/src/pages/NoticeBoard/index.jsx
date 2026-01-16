import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, Users, Bell } from 'lucide-react';
import api from '../../utils/api';
import { useOutletContext } from 'react-router-dom';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/80 backdrop-blur-2xl rounded-2xl p-6 w-full max-w-md border border-white/40 shadow-2xl">
        <div className="flex justify-between items-center mb-4 border-b border-white/40 pb-3 -mx-6 px-6 pt-1 rounded-t-2xl"
             style={{ backgroundImage: 'linear-gradient(to right, var(--ui-accent-strong), transparent)' }}>
          <h2 className="text-xl font-bold text-gradient">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center bg-white/80 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-3xl font-display font-bold text-gradient">Notice Board</h1>
          <p className="text-slate-500">Important announcements and updates</p>
        </div>
        {canManage && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 btn-primary"
          >
            <Plus size={20} />
            Add Notice
          </button>
        )}
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-soft border border-white/50 p-6 mt-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 rounded-full border-4 border-slate-200 animate-spin"
                 style={{ borderTopColor: 'var(--ui-accent)' }} />
          </div>
        ) : notices.length === 0 ? (
          <div className="text-center py-12 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
            <Bell size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-1">No notices found</h3>
            <p className="text-slate-500 text-sm">Check back later for updates</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {notices.map((notice) => (
            <div key={notice.id} className="bg-white/80 rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-[2rem]"
                   style={{ backgroundImage: 'linear-gradient(to bottom right, var(--ui-accent-strong), var(--ui-accent-soft))' }} />
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">{notice.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(notice.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded-full text-xs font-medium text-indigo-700 border border-indigo-100">
                      <Users size={12} />
                      {notice.audience}
                    </span>
                  </div>
                </div>
                {canManage && (
                  <button
                    onClick={() => handleDelete(notice.id)}
                    className="text-rose-500 hover:text-rose-600"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
              <p className="text-slate-700 whitespace-pre-line">{notice.content}</p>
            </div>
          ))}
          </div>
        )}
      </div>

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
