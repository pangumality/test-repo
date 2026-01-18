import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

export default function ELearningSubjects() {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          className="w-12 h-12 rounded-full border-4 border-slate-200 animate-spin"
          style={{ borderTopColor: 'var(--ui-accent)' }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold text-gradient tracking-tight">
            E-Learning Resources
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Explore interactive subjects and digital content for your classes
          </p>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-soft p-6">
        {subjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 mb-4"
              style={{
                backgroundImage:
                  'linear-gradient(to bottom right, var(--ui-accent-strong), var(--ui-accent))',
              }}
            >
              <span className="text-2xl">📚</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-1">No subjects found</h3>
            <p className="text-sm text-slate-500">
              Once subjects are added, you will see all available resources here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {subjects.map((s, index) => (
              <Link
                key={s.id}
                to={`/dashboard/e-learning/${s.id}`}
                className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white/70 transition-all duration-300 shadow-sm hover:shadow-lg flex items-center justify-between px-4 py-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform"
                    style={{
                      backgroundImage:
                        'linear-gradient(to bottom right, var(--ui-accent-strong), var(--ui-accent-secondary))',
                    }}
                  >
                    <span className="text-sm font-semibold">
                      {s.name?.[0]?.toUpperCase() || 'S'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-700 group-hover:text-slate-900">
                      {s.name}
                    </span>
                    <span className="text-xs text-slate-400">Subject {index + 1}</span>
                  </div>
                </div>
                <span
                  className="text-xs font-semibold px-3 py-1 rounded-full border transition-colors"
                  style={{
                    backgroundColor: 'var(--ui-accent-soft)',
                    color: 'var(--ui-accent)',
                  }}
                >
                  Open
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

