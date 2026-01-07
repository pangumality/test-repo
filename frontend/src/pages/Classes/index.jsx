import React, { useEffect, useState } from 'react';
import api from '../../utils/api';

export default function Classes() {
  const [list, setList] = useState([]);
  const [name, setName] = useState('');
  const [sectionName, setSectionName] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const loadClasses = async () => {
    try {
      const { data } = await api.get('/classes');
      setList(data);
    } catch (err) {
      console.error(err);
      alert('Failed to load classes');
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const addClass = async () => {
    if (!name.trim()) return;
    try {
      await api.post('/classes', { name: name.trim(), sections: [] });
      setName('');
      loadClasses();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add class');
    }
  };

  const deleteClass = async (id) => {
    if (!window.confirm('Are you sure? This cannot be undone.')) return;
    try {
      await api.delete(`/classes/${id}`);
      if (selectedId === id) setSelectedId(null);
      loadClasses();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete class');
    }
  };

  const addSection = async () => {
    if (!selectedId || !sectionName.trim()) return;
    const klass = list.find(c => c.id === selectedId);
    if (!klass) return;

    try {
      const newSections = [...(klass.sections || []), sectionName.trim()];
      // Remove duplicates
      const uniqueSections = [...new Set(newSections)];
      
      await api.put(`/classes/${selectedId}`, {
        name: klass.name,
        sections: uniqueSections
      });
      setSectionName('');
      loadClasses();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add section');
    }
  };

  const removeSection = async (id, sec) => {
    if (!window.confirm(`Remove section ${sec}?`)) return;
    const klass = list.find(c => c.id === id);
    if (!klass) return;

    try {
      const newSections = (klass.sections || []).filter(s => s !== sec);
      await api.put(`/classes/${id}`, {
        name: klass.name,
        sections: newSections
      });
      loadClasses();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove section');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-700 uppercase">Classes</h2>

      <div className="bg-white rounded-xl shadow-soft p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">New Class</label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                className="flex-1 border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-gray-400"
                placeholder="Class name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <button
                className="px-3 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-700"
                onClick={addClass}
              >
                Add
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Selected Class</label>
            <select
              className="w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-gray-400"
              value={selectedId || ''}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              <option value="" disabled>Select a class</option>
              {list.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">Add Section</label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                className="flex-1 border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-gray-400"
                placeholder="Section name"
                value={sectionName}
                onChange={(e) => setSectionName(e.target.value)}
              />
              <button
                className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                onClick={addSection}
              >
                Add Section
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left text-sm text-gray-600 px-4 py-2 border-b">Class</th>
                <th className="text-left text-sm text-gray-600 px-4 py-2 border-b">Sections</th>
                <th className="text-left text-sm text-gray-600 px-4 py-2 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map(c => (
                <tr key={c.id} className="odd:bg-white even:bg-gray-50">
                  <td className="px-4 py-2 border-b text-gray-800">{c.name}</td>
                  <td className="px-4 py-2 border-b">
                    <div className="flex flex-wrap gap-2">
                      {(c.sections || []).map(sec => (
                        <span key={sec} className="px-2 py-1 rounded-md border border-gray-300 text-gray-700">
                          {sec}
                          <button
                            className="ml-2 text-xs text-gray-600 hover:underline"
                            onClick={() => removeSection(c.id, sec)}
                          >
                            Remove
                          </button>
                        </span>
                      ))}
                      {(c.sections || []).length === 0 && (
                        <span className="text-gray-500">No sections</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 border-b">
                    <button
                      className="px-3 py-1 rounded-md bg-gray-600 text-white hover:bg-gray-700"
                      onClick={() => deleteClass(c.id)}
                    >
                      Delete
                    </button>
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
