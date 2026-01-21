import React, { useEffect, useMemo, useState, useRef } from 'react';
import api from '../../utils/api';
import Toast from '../../components/Toast';

export default function Students() {
  const [classesList, setClassesList] = useState([]);
  const [klass, setKlass] = useState('');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ 
    firstName: '', lastName: '', email: '', phone: '', gender: '', klass: '', section: '',
    grade: '',
    dateOfBirth: '', bloodGroup: '', healthCondition: '', religion: '',
    guardianName: '', guardianEmail: '', guardianPhone: '',
    portrait: ''
  });
  const [list, setList] = useState([]);
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null); // { message, type }

  const handleBulkUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!window.confirm(`Upload ${file.name}? This will create students from the Excel file.`)) {
        e.target.value = '';
        return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await api.post('/students/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const { results } = res.data;
      const msg = `Upload Complete! Success: ${results.success}, Failed: ${results.failed}`;
      setToast({ message: msg, type: results.failed > 0 ? 'error' : 'success' });

      if (results.errors.length > 0) {
        console.table(results.errors);
      }
      loadStudents(klass);
    } catch (err) {
      console.error('Bulk upload failed', err);
      setToast({ message: 'Bulk upload failed: ' + (err.response?.data?.error || err.message), type: 'error' });
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const loadClasses = async () => {
    try {
      const { data } = await api.get('/classes');
      setClassesList(data);
      // Removed auto-selection of first class to allow "All Classes" view
    } catch {
      setClassesList([]);
    }
  };

  const loadStudents = async (cid) => {
    try {
      const url = cid ? `/students?classId=${cid}` : '/students';
      const { data } = await api.get(url);
      setList(data);
    } catch {
      setList([]);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    loadStudents(klass);
  }, [klass]);

  const filtered = useMemo(() => {
    return list.filter(s => `${s.firstName} ${s.lastName} ${s.email} ${s.phone} ${s.gender}`.toLowerCase().includes(search.toLowerCase()));
  }, [list, search]);

  const startAdd = () => {
    setEditingId('new');
    setForm({ 
      firstName: '', lastName: '', email: '', phone: '', gender: '', 
      klass: klass || (classesList[0]?.id || ''), section: '',
      grade: '',
      dateOfBirth: '', bloodGroup: '', healthCondition: '', religion: '',
      guardianName: '', guardianEmail: '', guardianPhone: '',
      portrait: ''
    });
  };

  const startEdit = (s) => {
    setEditingId(s.id);
    setForm({
      firstName: s.firstName || '',
      lastName: s.lastName || '',
      email: s.email || '',
      phone: s.phone || '',
      gender: s.gender || '',
      klass: s.classId,
      section: s.section || '',
      grade: s.grade || '',
      dateOfBirth: s.dateOfBirth ? s.dateOfBirth.split('T')[0] : '',
      bloodGroup: s.bloodGroup || '',
      healthCondition: s.healthCondition || '',
      religion: s.religion || '',
      guardianName: s.guardianName || '',
      guardianEmail: s.guardianEmail || '',
      guardianPhone: s.guardianPhone || '',
      portrait: s.portrait || ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ 
      firstName: '', lastName: '', email: '', phone: '', gender: '', 
      klass: klass || '', section: '',
      grade: '',
      dateOfBirth: '', bloodGroup: '', healthCondition: '', religion: '',
      guardianName: '', guardianEmail: '', guardianPhone: '',
      portrait: ''
    });
  };

  const handlePortraitUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const data = new FormData();
      data.append('image', file);
      const res = await api.post('/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const url = res.data && res.data.url;
      if (url) {
        setForm(prev => ({ ...prev, portrait: url }));
      }
    } catch (err) {
      console.error('Failed to upload portrait', err);
      alert('Failed to upload portrait');
    } finally {
      e.target.value = '';
    }
  };

  const save = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.klass) return;
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email || undefined,
        phone: form.phone || undefined,
        gender: form.gender || undefined,
        classId: form.klass,
        section: form.section || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        bloodGroup: form.bloodGroup || undefined,
        healthCondition: form.healthCondition || undefined,
        religion: form.religion || undefined,
        guardianName: form.guardianName || undefined,
        guardianEmail: form.guardianEmail || undefined,
        guardianPhone: form.guardianPhone || undefined,
        portrait: form.portrait || undefined
      };

      if (editingId === 'new') {
        await api.post('/students', payload);
      } else {
        await api.put(`/students/${editingId}`, payload);
      }
      cancelEdit();
      loadStudents(klass);
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        'Failed to save student';
      alert(msg);
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/students/${id}`);
      loadStudents(klass);
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        'Failed to delete student';
      alert(msg);
    }
  };

  // Get sections for current selected class in form
  const currentClassSections = useMemo(() => {
    const c = classesList.find(c => c.id === form.klass);
    return c?.sections || [];
  }, [classesList, form.klass]);

  return (
    <div className="space-y-6">
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
      <h2 className="text-xl font-bold text-gray-700 uppercase">Students</h2>

      <div className="bg-white rounded-xl shadow-soft p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Class</label>
            <select
              className="w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-gray-400"
              value={klass}
              onChange={(e) => {
                const id = e.target.value;
                setKlass(id);
              }}
            >
              <option value="">All Classes</option>
              {classesList.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">Search</label>
            <input
              type="text"
              className="w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-gray-400"
              placeholder="Search student"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              className="px-3 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 flex-1"
              onClick={handleBulkUploadClick}
              disabled={loading}
            >
              Bulk Upload
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".xlsx,.xls,.csv" 
              onChange={handleFileChange} 
            />
            <button
              className="px-3 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-700 flex-1"
              onClick={startAdd}
              disabled={loading}
            >
              Add Student
            </button>
          </div>
        </div>

        {editingId && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg space-y-4">
          <h3 className="font-semibold text-gray-700">Student Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              className="border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-gray-400"
              placeholder="First name"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
            <input
              type="text"
              className="border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-gray-400"
              placeholder="Last name"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
            <input
              type="email"
              className="border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-gray-400"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <input
              type="tel"
              className="border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-gray-400"
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <div className="md:col-span-2 flex flex-col gap-1">
              <span className="text-sm text-gray-600">Profile picture</span>
              <input
                type="file"
                accept="image/*"
                className="border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-gray-400"
                onChange={handlePortraitUpload}
              />
            </div>
            <select
              className="border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-gray-400"
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
            >
              <option value="">Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            <input 
              type="date"
              className="border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-gray-400"
              placeholder="Date of Birth"
              value={form.dateOfBirth}
              onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
            />
            <input 
              type="text"
              className="border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-gray-400"
              placeholder="Blood Group"
              value={form.bloodGroup}
              onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
            />
             <input 
              type="text"
              className="border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-gray-400"
              placeholder="Religion"
              value={form.religion}
              onChange={(e) => setForm({ ...form, religion: e.target.value })}
            />
             <input 
              type="text"
              className="border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-gray-400 md:col-span-2"
              placeholder="Health Condition"
              value={form.healthCondition}
              onChange={(e) => setForm({ ...form, healthCondition: e.target.value })}
            />
            <select
              className="border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-gray-400"
              value={form.klass}
              onChange={(e) => {
                const id = e.target.value;
                setForm({ ...form, klass: id, section: '' });
              }}
            >
              {classesList.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              className="border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-gray-400"
              value={form.section}
              onChange={(e) => setForm({ ...form, section: e.target.value })}
            >
              <option value="">Select Section</option>
              {currentClassSections.map(sec => (
                <option key={sec} value={sec}>{sec}</option>
              ))}
            </select>
             <input 
              type="text"
              className="border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-gray-400"
              placeholder="Grade"
              value={form.grade}
              onChange={(e) => setForm({ ...form, grade: e.target.value })}
            />
          </div>

          <h3 className="font-semibold text-gray-700 pt-2 border-t border-gray-200">Guardian Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <input 
              type="text"
              className="border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-gray-400"
              placeholder="Guardian Name"
              value={form.guardianName}
              onChange={(e) => setForm({ ...form, guardianName: e.target.value })}
            />
            <input 
              type="email"
              className="border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-gray-400"
              placeholder="Guardian Email (Login)"
              value={form.guardianEmail}
              onChange={(e) => setForm({ ...form, guardianEmail: e.target.value })}
            />
            <input 
              type="tel"
              className="border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-gray-400"
              placeholder="Guardian Phone"
              value={form.guardianPhone}
              onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-3 pt-4">
              <button
                className="px-3 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-700"
                onClick={save}
              >
                Save
              </button>
              <button
                className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                onClick={cancelEdit}
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
                <th className="text-left text-sm text-gray-600 px-4 py-2 border-b">First Name</th>
                <th className="text-left text-sm text-gray-600 px-4 py-2 border-b">Last Name</th>
                <th className="text-left text-sm text-gray-600 px-4 py-2 border-b">Email</th>
                <th className="text-left text-sm text-gray-600 px-4 py-2 border-b">Phone</th>
                <th className="text-left text-sm text-gray-600 px-4 py-2 border-b">Gender</th>
                <th className="text-left text-sm text-gray-600 px-4 py-2 border-b">Class</th>
                <th className="text-left text-sm text-gray-600 px-4 py-2 border-b">Section</th>
                <th className="text-left text-sm text-gray-600 px-4 py-2 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="odd:bg-white even:bg-gray-50">
                  <td className="px-4 py-2 border-b text-gray-800">{s.firstName}</td>
                  <td className="px-4 py-2 border-b text-gray-800">{s.lastName}</td>
                  <td className="px-4 py-2 border-b text-gray-700">{s.email || '-'}</td>
                  <td className="px-4 py-2 border-b text-gray-700">{s.phone || '-'}</td>
                  <td className="px-4 py-2 border-b text-gray-700">{s.gender || '-'}</td>
                  <td className="px-4 py-2 border-b text-gray-700">{classesList.find(c => c.id === s.classId)?.name || s.className || '-'}</td>
                  <td className="px-4 py-2 border-b text-gray-700">{s.section || '-'}</td>
                  <td className="px-4 py-2 border-b">
                    <div className="flex items-center gap-3">
                      <button
                        className="px-3 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                        onClick={() => startEdit(s)}
                      >
                        Edit
                      </button>
                      <button
                        className="px-3 py-1 rounded-md bg-gray-600 text-white hover:bg-gray-700"
                        onClick={() => remove(s.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
