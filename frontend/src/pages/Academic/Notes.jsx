import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import Toast from '../../components/Toast';
import { useOutletContext } from 'react-router-dom';

export default function Notes() {
  const { currentUser } = useOutletContext();
  const [notes, setNotes] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  
  // Form State
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', classId: '', subjectId: '' });
  const [file, setFile] = useState(null);

  const canEdit = ['school_admin', 'teacher', 'admin'].includes(currentUser?.role);

  useEffect(() => {
    fetchNotes();
    if (canEdit) {
      fetchClasses();
      fetchSubjects();
    }
  }, [canEdit]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/academic/notes');
      setNotes(data);
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
        formData.append('image', file); // Reuse existing upload endpoint which expects 'image' field for generic files
        const upRes = await api.post('/upload', formData);
        if (upRes.data.url) {
            attachments.push({ name: file.name, url: upRes.data.url });
        }
      }

      await api.post('/academic/notes', { ...form, attachments });
      setToast({ message: 'Note added successfully', type: 'success' });
      setShowForm(false);
      setForm({ title: '', content: '', classId: '', subjectId: '' });
      setFile(null);
      fetchNotes();
    } catch (err) {
      setToast({ message: 'Failed to add note', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this note?')) return;
    try {
      await api.delete(`/academic/notes/${id}`);
      setToast({ message: 'Note deleted', type: 'success' });
      fetchNotes();
    } catch (err) {
      setToast({ message: 'Failed to delete', type: 'error' });
    }
  };

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-700">Class Notes</h3>
        {canEdit && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            {showForm ? 'Cancel' : 'Add Note'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 bg-gray-50 p-6 rounded-xl border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Title"
              className="px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none"
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
              required
            />
             <input
              type="file"
              className="px-4 py-2 rounded-lg border bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              onChange={e => setFile(e.target.files[0])}
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
          </div>
          <textarea
            placeholder="Content / Description"
            className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none mb-4 h-32"
            value={form.content}
            onChange={e => setForm({...form, content: e.target.value})}
          ></textarea>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Note'}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {notes.length === 0 ? (
             <p className="text-gray-500 col-span-full text-center py-10">No notes found.</p>
        ) : (
            notes.map(note => (
            <div key={note.id} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-1 rounded">
                        {note.subject?.name} • {note.klass?.name}
                    </span>
                    {canEdit && (
                        <button onClick={() => handleDelete(note.id)} className="text-red-400 hover:text-red-600">✕</button>
                    )}
                </div>
                <h4 className="font-bold text-gray-800 mb-2">{note.title}</h4>
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">{note.content}</p>
                
                {note.attachments && note.attachments.length > 0 && (
                    <div className="pt-3 border-t border-gray-100">
                        {note.attachments.map((att, idx) => (
                            <a 
                                key={idx} 
                                href={att.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs flex items-center gap-2 text-blue-600 hover:underline"
                            >
                                📎 {att.name || 'Download Attachment'}
                            </a>
                        ))}
                    </div>
                )}
                <div className="mt-3 text-xs text-gray-400">
                    {new Date(note.createdAt).toLocaleDateString()}
                </div>
            </div>
            ))
        )}
      </div>
    </div>
  );
}
