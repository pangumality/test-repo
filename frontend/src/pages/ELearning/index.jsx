import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

export default function ELearning() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const { data } = await api.get('/subjects');
        setSubjects(data);
      } catch (error) {
        console.error('Failed to fetch subjects', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-700 uppercase">E-Learning Resources</h2>
      <div className="bg-white rounded-xl shadow-soft p-6">
        {subjects.length === 0 ? (
          <p className="text-gray-500">No subjects found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {subjects.map((s) => (
              <Link
                key={s.id}
                to={`/e-learning/${s.id}`}
                className="px-3 py-3 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-100 flex justify-between items-center"
              >
                <span>{s.name}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
