import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Plus, Trash2, Edit2, X } from 'lucide-react';
import api from '../utils/api';

function SubjectTopics({ subjectId }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });
  const [editingId, setEditingId] = useState(null);
  
  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/class-notes?subjectId=${subjectId}`);
      setNotes(data);
    } catch (e) {
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => { load(); }, [subjectId]);
  
  const save = async () => {
    try {
      if (editingId) {
        await api.put(`/class-notes/${editingId}`, { ...form, subjectId });
      } else {
        await api.post('/class-notes', { ...form, subjectId });
      }
      setForm({ title: '', content: '' });
      setEditingId(null);
      setShowForm(false);
      load();
    } catch (e) {
      alert('Failed to save');
    }
  };
  
  const remove = async (id) => {
    if (!window.confirm('Delete this topic?')) return;
    try {
      await api.delete(`/class-notes/${id}`);
      load();
    } catch (e) {
      alert('Failed to delete');
    }
  };
  
  return (
    <div className="border border-gray-100 rounded-lg p-3">
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm text-gray-700">Topics for this subject</div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm({ title: '', content: '' }); }}
          className="px-2 py-1 text-xs bg-indigo-600 text-white rounded-md"
        >
          Add Topic
        </button>
      </div>
      {loading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : notes.length === 0 ? (
        <div className="text-sm text-gray-500">No topics yet.</div>
      ) : (
        <ul className="space-y-2">
          {notes.map(n => (
            <li key={n.id} className="flex justify-between items-start gap-3 border border-gray-100 rounded-md p-2">
              <div>
                <div className="text-sm font-medium text-gray-800">{n.title}</div>
                <div className="text-xs text-gray-600 whitespace-pre-wrap">
                  {String(n.content || '')
                    .split(/\s+/)
                    .slice(0, 100)
                    .join(' ')}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setEditingId(n.id); setForm({ title: n.title, content: n.content }); setShowForm(true); }}
                  className="px-2 py-1 text-xs border border-gray-300 rounded-md"
                >
                  Edit
                </button>
                <button
                  onClick={() => remove(n.id)}
                  className="px-2 py-1 text-xs bg-red-600 text-white rounded-md"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      
      {showForm && (
        <div className="mt-3 border-t pt-3">
          <div className="grid grid-cols-1 gap-2">
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-2 py-1 border border-gray-300 rounded-md"
              placeholder="Topic title"
            />
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="w-full px-2 py-1 border border-gray-300 rounded-md"
              placeholder="Details"
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowForm(false); setEditingId(null); }}
                className="px-2 py-1 text-xs border border-gray-300 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={save}
                className="px-2 py-1 text-xs bg-gray-800 text-white rounded-md"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function AddExistingStudentSelect({ students, classId, onDone }) {
  const [selected, setSelected] = useState('');
  const [saving, setSaving] = useState(false);
  const addExisting = async () => {
    if (!selected || saving) return;
    setSaving(true);
    try {
      await api.put(`/students/${selected}`, { classId });
      await onDone();
      setSelected('');
    } catch (e) {
      alert('Failed to add student');
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="mb-2 flex items-center gap-2">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="border border-gray-200 rounded-md px-2 py-1"
      >
        <option value="">Select existing student</option>
        {students.map(s => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
      <button
        onClick={addExisting}
        disabled={!selected || saving}
        className="text-xs px-2 py-1 bg-gray-700 text-white rounded-md disabled:opacity-50"
      >
        Add to class
      </button>
    </div>
  );
}
function AddStudentInline({ classId, onUpdated }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  
  const add = async () => {
    const trimmed = name.trim();
    if (!trimmed || saving) return;
    const parts = trimmed.split(' ');
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ') || '-';
    setSaving(true);
    try {
      await api.post('/students', { firstName, lastName, email: email || undefined, classId });
      const { data } = await api.get(`/students?classId=${classId}`);
      const mapped = (data || []).map(s => ({ id: s.id, name: s.name }));
      onUpdated(mapped);
      setName('');
      setEmail('');
    } catch (e) {
      alert('Failed to add student');
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="mt-2 flex items-center gap-2">
      <input
        type="text"
        placeholder="Student name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border border-gray-200 rounded-md px-2 py-1"
      />
      <input
        type="email"
        placeholder="Email (optional)"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border border-gray-200 rounded-md px-2 py-1"
      />
      <button
        onClick={add}
        disabled={saving || !name.trim()}
        className="text-xs px-2 py-1 bg-indigo-600 text-white rounded-md disabled:opacity-50"
      >
        Add
      </button>
    </div>
  );
}
const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState({ name: '', teacherUserId: '' });
  const [teachers, setTeachers] = useState([]);
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const canManage = currentUser?.role === 'admin' || currentUser?.role === 'staff';
  const canAccess = canManage || currentUser?.role === 'teacher';
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [allStudents, setAllStudents] = useState([]);

  const fetchSubjects = async () => {
    try {
      const { data } = await api.get('/subjects');
      setSubjects(data);
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSubject) {
        await api.put(`/subjects/${editingSubject.id}`, formData);
      } else {
        await api.post('/subjects', formData);
      }
      setFormData({ name: '' });
      setEditingSubject(null);
      setShowModal(false);
      fetchSubjects();
    } catch (error) {
      console.error('Failed to save subject:', error);
      alert('Failed to save subject');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;
    try {
      await api.delete(`/subjects/${id}`);
      fetchSubjects();
    } catch (error) {
      console.error('Failed to delete subject:', error);
      alert('Failed to delete subject');
    }
  };

  const openEditModal = (subject) => {
    setEditingSubject(subject);
    setFormData({ name: subject.name });
    setShowModal(true);
  };
  
  useEffect(() => {
    const loadDetails = async () => {
      if (!editingSubject) {
        setDetails(null);
        return;
      }
      setDetailsLoading(true);
      try {
        const [d, t, s] = await Promise.all([
          api.get(`/subjects/${editingSubject.id}/details`),
          api.get('/teachers'),
          api.get('/students')
        ]);
        setDetails(d.data);
        setTeachers(t.data);
        setAllStudents(s.data);
      } catch (e) {
        setDetails(null);
      } finally {
        setDetailsLoading(false);
      }
    };
    loadDetails();
  }, [editingSubject]);
  
  const changeAssignmentTeacher = async (assignmentId, teacherUserId) => {
    try {
      const res = await api.put(`/class-subjects/${assignmentId}`, { teacherUserId });
      if (details) {
        const nextAssignments = (details.assignments || []).map(a =>
          a.id === assignmentId ? { ...a, teacherUserId: res.data.teacherUserId, teacherName: res.data.teacherName } : a
        );
        setDetails({ ...details, assignments: nextAssignments });
      }
    } catch (e) {
      alert('Failed to update teacher');
    }
  };

  const openCreateModal = () => {
    setEditingSubject(null);
    setFormData({ name: '', teacherUserId: '' });
    api.get('/teachers')
      .then((t) => {
        setTeachers(t.data);
        setShowModal(true);
      })
      .catch(() => setShowModal(true));
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Subjects</h1>
          <p className="text-gray-600">Manage school subjects</p>
        </div>
        {canManage && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus size={20} />
            Add Subject
          </button>
        )}
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject) => (
            <div
              key={subject.id}
              className={`bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center ${canAccess ? 'cursor-pointer hover:bg-gray-50' : ''}`}
              onClick={() => { if (canAccess) openEditModal(subject); }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <BookOpen size={24} />
                </div>
                <h3 className="font-semibold text-gray-800">{subject.name}</h3>
              </div>
              {canManage && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); openEditModal(subject); }}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(subject.id); }}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">
                {editingSubject ? (canManage ? 'Edit Subject' : editingSubject.name) : 'Add New Subject'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            {canManage && (
            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Mathematics"
                  required
                />
              </div>
              
              {!editingSubject && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign Teacher</label>
                    <select
                      value={formData.teacherUserId}
                      onChange={(e) => setFormData({ ...formData, teacherUserId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    >
                      <option value="">Select teacher</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  disabled={!editingSubject && teachers.length === 0}
                >
                  {editingSubject ? 'Save Changes' : 'Create Subject'}
                </button>
              </div>
            </form>
            )}
            
            {editingSubject && (
              <div className="p-6 border-t">
                <h3 className="text-md font-semibold text-gray-800 mb-3">Subject Details</h3>
                {detailsLoading ? (
                  <div>Loading...</div>
                ) : details ? (
                  <>
                    <div className="mb-6">
                      <div className="text-sm text-gray-600 mb-2">Topics / Sections</div>
                      <SubjectTopics subjectId={editingSubject.id} />
                    </div>
                    {canManage && (
                    <div className="mb-4">
                      <div className="text-sm text-gray-600 mb-2">Assignments</div>
                      <div className="space-y-3">
                        {(details.assignments || []).map(a => (
                          <div key={a.id} className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="text-gray-800">{a.className}</div>
                              <div className="text-xs text-gray-500">{a.teacherName || 'Unassigned'}</div>
                            </div>
                            <select
                              value={a.teacherUserId || ''}
                              onChange={(e) => changeAssignmentTeacher(a.id, e.target.value)}
                              className="border border-gray-200 rounded-md px-2 py-1"
                            >
                              <option value="">Select teacher</option>
                              {teachers.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                    )}
                    {canManage && (
                    <div>
                      <div className="text-sm text-gray-600 mb-2">Students</div>
                      <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
                        {(details.students || []).map(group => (
                          <div key={group.classId} className="border border-gray-100 rounded-lg p-3">
                            <div className="text-sm font-medium text-gray-700 mb-2">{group.className}</div>
                            <AddExistingStudentSelect
                              students={allStudents}
                              classId={group.classId}
                              onDone={async () => {
                                try {
                                  const d = await api.get(`/subjects/${editingSubject.id}/details`);
                                  setDetails(d.data);
                                } catch {}
                              }}
                            />
                            <AddStudentInline
                              classId={group.classId}
                              onUpdated={(students) => {
                                const next = (details.students || []).map(g => {
                                  if (g.classId === group.classId) {
                                    return { ...g, students };
                                  }
                                  return g;
                                });
                                setDetails({ ...details, students: next });
                              }}
                            />
                            {group.students.length === 0 ? (
                              <div className="text-xs text-gray-500">No students</div>
                            ) : (
                              <ul className="text-sm text-gray-700 grid grid-cols-2 gap-x-4 gap-y-1">
                                {group.students.map(s => (
                                  <li key={s.id} className="flex items-center justify-between gap-2">
                                    <span>{s.name}</span>
                                    <button
                                      onClick={async () => {
                                        if (!window.confirm('Remove this student?')) return;
                                        try {
                                          await api.delete(`/students/${s.id}`);
                                          const next = (details.students || []).map(g => {
                                            if (g.classId === group.classId) {
                                              return { ...g, students: g.students.filter(st => st.id !== s.id) };
                                            }
                                            return g;
                                          });
                                          setDetails({ ...details, students: next });
                                        } catch (e) {
                                          alert('Failed to remove student');
                                        }
                                      }}
                                      className="text-xs px-2 py-1 bg-red-600 text-white rounded-md"
                                    >
                                      Remove
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-gray-500">No details available.</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Subjects;
