import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Calendar, BookOpen, Edit2, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

export default function GroupStudies() {
  const navigate = useNavigate();
  const [studies, setStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    subjectId: '',
    meetingLink: ''
  });
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    setCurrentUser(JSON.parse(localStorage.getItem('currentUser') || '{}'));
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [studiesRes, subjectsRes] = await Promise.all([
        api.get('/group-studies'),
        api.get('/subjects')
      ]);
      setStudies(studiesRes.data);
      setSubjects(subjectsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        subjectId: formData.subjectId || null,
        meetingLink: formData.meetingLink || null
      };

      if (editingId) {
        await api.put(`/group-studies/${editingId}`, payload);
      } else {
        await api.post('/group-studies', payload);
      }
      setFormData({ title: '', description: '', date: '', subjectId: '', meetingLink: '' });
      setEditingId(null);
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error('Failed to save study group:', error);
      alert('Failed to save study group: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleEdit = (study) => {
    setFormData({
        title: study.title,
        description: study.description || '',
        date: study.date ? new Date(study.date).toISOString().slice(0, 16) : '',
        subjectId: study.subjectId || '',
        meetingLink: study.meetingLink || ''
    });
    setEditingId(study.id);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ title: '', description: '', date: '', subjectId: '', meetingLink: '' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await api.delete(`/group-studies/${id}`);
      fetchData();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const canManage = currentUser?.role === 'teacher' || currentUser?.role === 'admin' || currentUser?.role === 'student'; // Students can create too? User said "Student group studies"

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-xl font-bold text-gray-700 uppercase">Group Studies</h2>
            <p className="text-gray-600">Collaborate with peers</p>
        </div>
        
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus size={20} />
          New Group
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {studies.length === 0 ? (
          <p className="text-gray-500 col-span-3 text-center py-10">No active study groups found.</p>
        ) : (
          studies.map((study) => (
            <div key={study.id} className="bg-white p-6 rounded-xl shadow-soft border border-gray-100 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Users size={24} />
                  </div>
                  {(currentUser?.role === 'admin' || currentUser?.id === study.creatorId) && (
                    <div className="flex gap-2">
                        <button onClick={() => handleEdit(study)} className="text-blue-400 hover:text-blue-600">
                            <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDelete(study.id)} className="text-red-400 hover:text-red-600">
                            <Trash2 size={18} />
                        </button>
                    </div>
                  )}
                </div>
                
                <h3 className="text-lg font-bold text-gray-800 mb-2">{study.title}</h3>
                <p className="text-gray-600 mb-4 text-sm line-clamp-3">{study.description}</p>
                
                <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        <span>{new Date(study.date).toLocaleDateString()} {new Date(study.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    {study.subject && (
                        <div className="flex items-center gap-2">
                            <BookOpen size={16} />
                            <span>{study.subject.name}</span>
                        </div>
                    )}
                     <div className="flex items-center gap-2">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">By: {study.creator?.firstName} {study.creator?.lastName}</span>
                    </div>
                </div>
              </div>
              
              <button 
                onClick={() => navigate(`/group-studies/${study.id}/live`)}
                className="mt-4 w-full py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
              >
                <Video size={18} />
                Join Live Room
              </button>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Study Group' : 'Create Study Group'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg h-24"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="datetime-local"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject (Optional)</label>
                <select
                  value={formData.subjectId}
                  onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">-- Select Subject --</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
