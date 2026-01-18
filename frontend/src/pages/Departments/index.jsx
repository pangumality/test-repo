import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Users, Save, Loader2 } from 'lucide-react';
import api from '../../utils/api';

const Departments = () => {
  const { currentUser } = useOutletContext() || {};
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [staff, setStaff] = useState([]);
  const [assigned, setAssigned] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [deptRes, staffRes] = await Promise.all([
          api.get('/departments'),
          api.get('/teachers'),
        ]);
        const allDepts = Array.isArray(deptRes.data) ? deptRes.data : [];
        const filtered = allDepts.filter((d) =>
          ['inventory', 'transport', 'library', 'hostel', 'reception', 'radio'].includes(d)
        );
        setDepartments(filtered);
        setStaff(
          Array.isArray(staffRes.data)
            ? staffRes.data.map((t) => ({
                id: t.id,
                name: t.name || '',
                email: t.email || '',
              }))
            : []
        );
        if (filtered.length > 0) {
          setSelectedDept(filtered[0]);
        }
      } catch (e) {
        setError('Failed to load departments or staff');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadAssigned = async () => {
      if (!selectedDept) return;
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get(`/departments/${selectedDept}/staff`);
        setAssigned(Array.isArray(data) ? data.map((u) => u.id) : []);
      } catch (e) {
        setError('Failed to load department admins');
        setAssigned([]);
      } finally {
        setLoading(false);
      }
    };
    loadAssigned();
  }, [selectedDept]);

  const toggleStaff = (id) => {
    setAssigned((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!selectedDept) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.post(`/departments/${selectedDept}/staff`, {
        userIds: assigned,
      });
      setSuccess('Department admins updated successfully');
    } catch (e) {
      setError('Failed to save department admins');
    } finally {
      setSaving(false);
    }
  };

  const labelFor = (d) => {
    if (!d) return '';
    const map = {
      inventory: 'Inventory',
      transport: 'Transport',
      library: 'Library',
      hostel: 'Hostel',
      reception: 'Reception',
      radio: 'Radio',
    };
    return map[d] || d.charAt(0).toUpperCase() + d.slice(1);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 flex items-center gap-2">
            <Users className="text-indigo-500" size={22} />
            Department Admins
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Assign staff as admins for Inventory, Transport, Library, Hostel and Reception.
          </p>
        </div>
        {currentUser && (
          <div className="text-xs text-slate-500">
            School: <span className="font-medium">{currentUser.school?.name}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
          {success}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-soft border border-slate-100 p-4">
        <div className="flex flex-wrap gap-2 mb-4">
          {departments.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setSelectedDept(d)}
              className={
                selectedDept === d
                  ? 'px-3 py-1.5 text-xs rounded-full bg-indigo-600 text-white shadow'
                  : 'px-3 py-1.5 text-xs rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200'
              }
            >
              {labelFor(d)}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
            <Loader2 className="animate-spin" size={18} />
            Loading...
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h2 className="text-sm font-medium text-slate-700 mb-2">
                Staff list
              </h2>
              <div className="border border-slate-100 rounded-xl max-h-80 overflow-y-auto divide-y divide-slate-100">
                {staff.map((s) => (
                  <label
                    key={s.id}
                    className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={assigned.includes(s.id)}
                      onChange={() => toggleStaff(s.id)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-700">
                        {s.name}
                      </span>
                      {s.email && (
                        <span className="text-xs text-slate-400">
                          {s.email}
                        </span>
                      )}
                    </div>
                  </label>
                ))}
                {staff.length === 0 && (
                  <div className="px-3 py-4 text-sm text-slate-400">
                    No staff found. Add teachers first.
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col justify-between gap-4">
              <div>
                <h2 className="text-sm font-medium text-slate-700 mb-2">
                  Selected admins for {labelFor(selectedDept)}
                </h2>
                <div className="border border-indigo-50 rounded-xl bg-indigo-50/40 min-h-[4rem] p-3 text-sm text-slate-700">
                  {assigned.length === 0 && (
                    <p className="text-slate-400">
                      No admins selected yet. Choose staff from the list.
                    </p>
                  )}
                  {assigned.length > 0 && (
                    <ul className="space-y-1">
                      {assigned
                        .map((id) => staff.find((s) => s.id === id))
                        .filter(Boolean)
                        .map((s) => (
                          <li key={s.id} className="flex items-center justify-between">
                            <span>{s.name}</span>
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
                >
                  {saving && <Loader2 className="animate-spin" size={16} />}
                  <Save size={16} />
                  Save changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Departments;
