import React, { useState, useEffect } from 'react';
import { Newspaper, Plus, Trash2, Calendar, Send, Pencil } from 'lucide-react';
import api from '../../utils/api';
import { useOutletContext } from 'react-router-dom';

const Newsletter = () => {
  const { currentUser } = useOutletContext();
  const [newsletters, setNewsletters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Check if user can manage newsletters (Admin/Staff)
  // Assuming 'staff' role corresponds to School Admin in this context based on app logic
  // or explicitly check permissions if available in currentUser context.
  // For simplicity, checking roles.
  const canManage = ['admin', 'school_admin'].includes(currentUser?.role);

  useEffect(() => {
    fetchNewsletters();
  }, []);

  const fetchNewsletters = async () => {
    try {
      const response = await api.get('/newsletters');
      setNewsletters(response.data);
    } catch (error) {
      console.error('Failed to fetch newsletters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/newsletters/${editingId}`, formData);
      } else {
        await api.post('/newsletters', formData);
      }
      setFormData({ title: '', content: '' });
      setShowForm(false);
      setEditingId(null);
      fetchNewsletters();
    } catch (error) {
      console.error('Failed to save newsletter:', error);
      const msg = error.response?.data?.details || error.response?.data?.error || 'Failed to save newsletter';
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (newsletter) => {
    setFormData({ title: newsletter.title, content: newsletter.content });
    setEditingId(newsletter.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this newsletter?')) return;
    try {
      await api.delete(`/newsletters/${id}`);
      setNewsletters(newsletters.filter(n => n.id !== id));
    } catch (error) {
      console.error('Failed to delete newsletter:', error);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading newsletters...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">School Newsletters</h1>
          <p className="text-gray-500">Latest updates and announcements from the school</p>
        </div>
        {canManage && (
          <button
            onClick={() => {
              if (showForm) {
                setShowForm(false);
                setEditingId(null);
                setFormData({ title: '', content: '' });
              } else {
                setShowForm(true);
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            {showForm ? 'Cancel' : <><Plus size={20} /> Create Newsletter</>}
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-top-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">{editingId ? 'Edit Announcement' : 'New Announcement'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., End of Term Exam Schedule"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <textarea
                required
                rows={6}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write your announcement here..."
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Saving...' : <><Send size={18} /> {editingId ? 'Update Newsletter' : 'Publish Newsletter'}</>}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-6">
        {newsletters.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <Newspaper size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No newsletters have been published yet.</p>
          </div>
        ) : (
          newsletters.map((newsletter) => (
            <div key={newsletter.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-xl font-bold text-gray-800">{newsletter.title}</h2>
                {canManage && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(newsletter)}
                      className="text-gray-400 hover:text-blue-500 transition-colors p-1"
                      title="Edit Newsletter"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(newsletter.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      title="Delete Newsletter"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <Calendar size={14} />
                <span>{new Date(newsletter.publishedAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>
              <div className="prose prose-teal max-w-none text-gray-600 whitespace-pre-wrap">
                {newsletter.content}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Newsletter;
