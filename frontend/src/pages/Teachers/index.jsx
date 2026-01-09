import React, { useEffect, useMemo, useState } from 'react';
import api from '../../utils/api';

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function Teachers() {
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', subject: '' });
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [assigningTeacher, setAssigningTeacher] = useState(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [classes, setClasses] = useState([]);
  const [assignClassId, setAssignClassId] = useState('');
  const [assignSubjectId, setAssignSubjectId] = useState('');

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/teachers');
      setList(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching teachers:', err);
      setError('Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const openAssignModal = async (teacher) => {
    setAssigningTeacher(teacher);
    setAssignClassId('');
    setAssignSubjectId('');
    try {
      const clsRes = await api.get('/classes');
      setClasses(clsRes.data);
      setAssignModalOpen(true);
    } catch (err) {
      console.error('Failed to load classes', err);
      alert('Failed to load classes');
    }
  };

  const saveAssignment = async () => {
    if (!assignClassId || !assigningTeacher) return;
    try {
      await api.post('/class-subjects', {
        teacherUserId: assigningTeacher.id,
        classId: assignClassId
      });
      setAssignModalOpen(false);
      setAssigningTeacher(null);
      setAssignClassId('');
      setAssignSubjectId('');
      alert('Assignment created');
    } catch (err) {
      console.error('Failed to create assignment', err);
      alert(err.response?.data?.error || 'Failed to create assignment');
    }
  };

  const filtered = useMemo(() => {
    return list.filter(t =>
      `${t.name} ${t.email} ${t.subject}`.toLowerCase().includes(search.toLowerCase())
    );
  }, [list, search]);

  const startAdd = () => {
    setEditingId('new');
    setForm({ name: '', email: '', subject: '', phone: '', portrait: '', workExperience: '', qualifications: '' });
    setError('');
  };

  const startEdit = (t) => {
    setEditingId(t.id);
    setForm({
        name: t.name,
        email: t.email,
        subject: t.subject,
        phone: t.phone || '',
        portrait: t.portrait || '',
        workExperience: t.workExperience || '',
        qualifications: t.qualifications || ''
    });
    setError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ name: '', email: '', subject: '', phone: '', portrait: '', workExperience: '', qualifications: '' });
    setError('');
  };

  const save = async () => {
    if (!form.name.trim() || !form.email.trim()) return;
    
    setLoading(true);
    try {
      if (editingId === 'new') {
        const response = await api.post('/teachers', form);
        setList([response.data, ...list]);
      } else {
        // Edit not fully implemented in backend yet, but UI supports it
        // We can just update local list for now or implement PUT
        // For now, let's just focus on create as requested
        // setList(list.map(t => (t.id === editingId ? { ...t, ...form } : t)));
        alert("Edit not implemented on backend yet");
      }
      cancelEdit();
    } catch (err) {
      console.error('Error saving teacher:', err);
      setError(err.response?.data?.error || 'Failed to save teacher');
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Are you sure you want to delete this teacher?')) return;
    
    try {
      await api.delete(`/teachers/${id}`);
      setList(list.filter(t => t.id !== id));
    } catch (err) {
      console.error('Error deleting teacher:', err);
      alert('Failed to delete teacher');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-700 uppercase">Teachers</h2>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md border border-red-200">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-soft p-6">
        <div className="flex items-center gap-3">
          <button
            className="px-3 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50"
            onClick={startAdd}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Add Teacher'}
          </button>
          <button
            className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
            onClick={fetchTeachers}
          >
            Refresh
          </button>
          <input
            type="text"
            className="ml-auto w-64 border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-gray-400"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {editingId && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              className="border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-gray-400"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              type="email"
              className="border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-gray-400"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <input
              type="text"
              className="border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-gray-400"
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <input
              type="text"
              className="border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-gray-400"
              placeholder="Portrait URL"
              value={form.portrait}
              onChange={(e) => setForm({ ...form, portrait: e.target.value })}
            />
            <input
              type="text"
              className="border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-gray-400"
              placeholder="Subject (Optional)"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            />
            <textarea
              className="border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-gray-400 col-span-full md:col-span-2"
              placeholder="Work Experience"
              value={form.workExperience}
              onChange={(e) => setForm({ ...form, workExperience: e.target.value })}
            />
            <textarea
              className="border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-gray-400 col-span-full md:col-span-2"
              placeholder="Qualifications"
              value={form.qualifications}
              onChange={(e) => setForm({ ...form, qualifications: e.target.value })}
            />
            <div className="flex items-center gap-3 col-span-full">
              <button
                className="px-3 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50"
                onClick={save}
                disabled={loading}
              >
                Save
              </button>
              <button
                className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                onClick={cancelEdit}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left text-sm text-gray-600 px-4 py-2 border-b">Name</th>
                <th className="text-left text-sm text-gray-600 px-4 py-2 border-b">Email</th>
                <th className="text-left text-sm text-gray-600 px-4 py-2 border-b">Subject</th>
                <th className="text-left text-sm text-gray-600 px-4 py-2 border-b">Phone</th>
                <th className="text-left text-sm text-gray-600 px-4 py-2 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                 <tr>
                   <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                     No teachers found. Add one to get started.
                   </td>
                 </tr>
              ) : (
                filtered.map(t => (
                  <tr key={t.id} className="odd:bg-white even:bg-gray-50">
                    <td className="px-4 py-2 border-b text-gray-800">{t.name}</td>
                    <td className="px-4 py-2 border-b text-gray-700">{t.email}</td>
                    <td className="px-4 py-2 border-b text-gray-700">{t.phone}</td>
                    <td className="px-4 py-2 border-b text-gray-700">{t.subject}</td>
                    <td className="px-4 py-2 border-b">
                      <div className="flex items-center gap-3">
                        <button
                          className="px-3 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                          onClick={() => openAssignModal(t)}
                        >
                          Assign Class+Subject
                        </button>
                        {/* 
                        <button
                          className="px-3 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                          onClick={() => startEdit(t)}
                        >
                          Edit
                        </button>
                        */}
                        <button
                          className="px-3 py-1 rounded-md bg-gray-600 text-white hover:bg-gray-700"
                          onClick={() => remove(t.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {assignModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">Assign Class + Subject</h3>
              <p className="text-sm text-gray-500">{assigningTeacher?.name}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-2"
                  value={assignClassId}
                  onChange={(e) => setAssignClassId(e.target.value)}
                >
                  <option value="">Select class</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                onClick={() => { setAssignModalOpen(false); setAssigningTeacher(null); }}
              >
                Cancel
              </button>
              <button
                className="px-3 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50"
                disabled={!assignClassId}
                onClick={saveAssignment}
              >
                Save Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
