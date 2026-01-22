import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import Toast from '../../components/Toast';
import { useOutletContext } from 'react-router-dom';

export default function Assignments() {
  const { currentUser } = useOutletContext();
  const [items, setItems] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ 
    type: 'homework', // or 'classwork'
    title: '', 
    description: '', 
    classId: '', 
    subjectId: '',
    dueDate: '' 
  });
  const [file, setFile] = useState(null);

  const canEdit = ['school_admin', 'teacher', 'admin'].includes(currentUser?.role);

  useEffect(() => {
    fetchAssignments();
    if (canEdit) {
      fetchClasses();
      fetchSubjects();
    }
  }, [canEdit]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/academic/assignments');
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const { data } = await api.get('/classes');
      setClasses(data);
    } catch (err) {}
  };

  const fetchSubjects = async () => {
    try {
      const { data } = await api.get('/subjects');
      setSubjects(data);
    } catch (err) {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.classId || !form.subjectId) return;

    try {
      setLoading(true);
      let attachments = [];
      
      if (file) {
        const formData = new FormData();
        formData.append('image', file);
        const upRes = await api.post('/upload', formData);
        if (upRes.data.url) {
            attachments.push({ name: file.name, url: upRes.data.url });
        }
      }

      await api.post('/academic/assignments', { ...form, attachments });
      setToast({ message: 'Assignment created', type: 'success' });
      setShowForm(false);
      setForm({ type: 'homework', title: '', description: '', classId: '', subjectId: '', dueDate: '' });
      setFile(null);
      fetchAssignments();
    } catch (err) {
      setToast({ message: 'Failed to create', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm('Delete this assignment?')) return;
    try {
      await api.delete(`/academic/assignments/${id}?type=${type}`);
      setToast({ message: 'Deleted', type: 'success' });
      fetchAssignments();
    } catch (err) {
      setToast({ message: 'Failed to delete', type: 'error' });
    }
  };

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-700">Assignments</h3>
        {canEdit && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            {showForm ? 'Cancel' : 'Create Assignment'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 bg-gray-50 p-6 rounded-xl border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <select
              className="px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none"
              value={form.type}
              onChange={e => setForm({...form, type: e.target.value})}
            >
                <option value="homework">Homework</option>
                <option value="classwork">Classwork</option>
            </select>
            <input
              type="text"
              placeholder="Title"
              className="px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none"
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
              required
            />
            <select
              className="px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none"
              value={form.classId}
              onChange={e => setForm({...form, classId: e.target.value})}
              required
            >
              <option value="">Select Class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select
              className="px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none"
              value={form.subjectId}
              onChange={e => setForm({...form, subjectId: e.target.value})}
              required
            >
              <option value="">Select Subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input
              type="date"
              className="px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none"
              value={form.dueDate}
              onChange={e => setForm({...form, dueDate: e.target.value})}
              required
            />
             <input
              type="file"
              className="px-4 py-2 rounded-lg border bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              onChange={e => setFile(e.target.files[0])}
            />
          </div>
          <textarea
            placeholder="Description / Instructions"
            className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none mb-4 h-32"
            value={form.description}
            onChange={e => setForm({...form, description: e.target.value})}
          ></textarea>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
        </form>
      )}

      <div className="space-y-4">
        {items.length === 0 ? (
             <p className="text-gray-500 text-center py-10">No assignments found.</p>
        ) : (
            items.map(item => (
            <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${item.type === 'homework' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                            {item.type}
                        </span>
                        <span className="text-xs font-semibold text-gray-500">
                            {item.subject?.name} • {item.klass?.name}
                        </span>
                    </div>
                    <h4 className="font-bold text-gray-800">{item.title}</h4>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                    
                    {item.attachments && item.attachments.length > 0 && (
                        <div className="mt-2 flex gap-3">
                             {item.attachments.map((att, idx) => (
                                <a key={idx} href={att.url} target="_blank" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                    📎 {att.name || 'File'}
                                </a>
                             ))}
                        </div>
                    )}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-500 md:border-l md:pl-4 md:border-gray-100">
                    <div className="text-right">
                        <div className="text-xs uppercase tracking-wide opacity-70">Due Date</div>
                        <div className="font-medium text-gray-700">
                            {new Date(item.dueDate || item.date).toLocaleDateString()}
                        </div>
                    </div>
                    {canEdit && (
                        <button 
                            onClick={() => handleDelete(item.id, item.type)}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>
            ))
        )}
      </div>
    </div>
  );
}
