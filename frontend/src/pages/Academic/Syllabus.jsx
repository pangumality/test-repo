import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import Toast from '../../components/Toast';
import { useOutletContext } from 'react-router-dom';

export default function Syllabus() {
  const { currentUser } = useOutletContext();
  const [items, setItems] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', classId: '', subjectId: '', term: '' });
  const [file, setFile] = useState(null);

  const canEdit = ['school_admin', 'teacher', 'admin'].includes(currentUser?.role);

  useEffect(() => {
    fetchSyllabus();
    if (canEdit) {
      fetchClasses();
      fetchSubjects();
    }
  }, [canEdit]);

  const fetchSyllabus = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/academic/syllabus');
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
      let fileUrl = '';
      
      if (file) {
        const formData = new FormData();
        formData.append('image', file);
        const upRes = await api.post('/upload', formData);
        fileUrl = upRes.data.url;
      }

      await api.post('/academic/syllabus', { ...form, fileUrl });
      setToast({ message: 'Added successfully', type: 'success' });
      setShowForm(false);
      setForm({ title: '', content: '', classId: '', subjectId: '', term: '' });
      setFile(null);
      fetchSyllabus();
    } catch (err) {
      setToast({ message: 'Failed to add', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await api.delete(`/academic/syllabus/${id}`);
      setToast({ message: 'Deleted', type: 'success' });
      fetchSyllabus();
    } catch (err) {
      setToast({ message: 'Failed to delete', type: 'error' });
    }
  };

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-700">Past Papers & Syllabus</h3>
        {canEdit && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            {showForm ? 'Cancel' : 'Upload Resource'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 bg-gray-50 p-6 rounded-xl border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Title (e.g. 2024 Math Past Paper)"
              className="px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none"
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
              required
            />
            <input
              type="text"
              placeholder="Term (Optional)"
              className="px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none"
              value={form.term}
              onChange={e => setForm({...form, term: e.target.value})}
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
             <div className="md:col-span-2">
                <label className="block text-sm text-gray-600 mb-1">Upload File (PDF/Doc/Image)</label>
                <input
                    type="file"
                    className="w-full px-4 py-2 rounded-lg border bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    onChange={e => setFile(e.target.files[0])}
                />
            </div>
          </div>
          <textarea
            placeholder="Description (Optional)"
            className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none mb-4 h-24"
            value={form.content}
            onChange={e => setForm({...form, content: e.target.value})}
          ></textarea>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Uploading...' : 'Upload'}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.length === 0 ? (
             <p className="text-gray-500 col-span-full text-center py-10">No resources found.</p>
        ) : (
            items.map(item => (
            <div key={item.id} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {item.klass?.name}
                        </span>
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                            {item.subject?.name}
                        </span>
                        {item.term && <span className="text-xs text-gray-400">({item.term})</span>}
                    </div>
                    <h4 className="font-bold text-gray-800">{item.title}</h4>
                    {item.content && <p className="text-sm text-gray-600 mt-1">{item.content}</p>}
                    
                    {item.fileUrl && (
                        <a 
                            href={item.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 mt-3 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition"
                        >
                            Download Resource
                        </a>
                    )}
                </div>
                
                {canEdit && (
                    <button 
                        onClick={() => handleDelete(item.id)}
                        className="text-gray-400 hover:text-red-500 p-1"
                    >
                        ✕
                    </button>
                )}
            </div>
            ))
        )}
      </div>
    </div>
  );
}
