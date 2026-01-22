import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import Toast from '../../components/Toast';
import { useOutletContext } from 'react-router-dom';

export default function Exams() {
  const { currentUser } = useOutletContext();
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', term: '', year: new Date().getFullYear() });
  const [papers, setPapers] = useState([{ subjectId: '', duration: 60, totalMarks: 100 }]);

  const canEdit = ['school_admin', 'admin'].includes(currentUser?.role);

  useEffect(() => {
    fetchExams();
    if (canEdit) {
      fetchSubjects();
    }
  }, [canEdit]);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/academic/exams');
      setExams(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const { data } = await api.get('/subjects');
      setSubjects(data);
    } catch (err) {}
  };

  const addPaperRow = () => {
    setPapers([...papers, { subjectId: '', duration: 60, totalMarks: 100 }]);
  };

  const removePaperRow = (idx) => {
    setPapers(papers.filter((_, i) => i !== idx));
  };

  const handlePaperChange = (idx, field, value) => {
    const newPapers = [...papers];
    newPapers[idx][field] = value;
    setPapers(newPapers);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return;

    try {
      setLoading(true);
      // Filter out empty papers
      const validPapers = papers.filter(p => p.subjectId);
      
      await api.post('/academic/exams', { ...form, papers: validPapers });
      setToast({ message: 'Exam created successfully', type: 'success' });
      setShowForm(false);
      setForm({ name: '', term: '', year: new Date().getFullYear() });
      setPapers([{ subjectId: '', duration: 60, totalMarks: 100 }]);
      fetchExams();
    } catch (err) {
      setToast({ message: 'Failed to create exam', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this exam? Warning: This will delete all results associated with it.')) return;
    try {
      await api.delete(`/academic/exams/${id}`);
      setToast({ message: 'Exam deleted', type: 'success' });
      fetchExams();
    } catch (err) {
      setToast({ message: 'Failed to delete', type: 'error' });
    }
  };

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-700">Exams Management</h3>
        {canEdit && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            {showForm ? 'Cancel' : 'Create Exam'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 bg-gray-50 p-6 rounded-xl border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <input
              type="text"
              placeholder="Exam Name (e.g. Mid Term 2025)"
              className="px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none md:col-span-2"
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              required
            />
             <input
              type="text"
              placeholder="Term (e.g. Term 1)"
              className="px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none"
              value={form.term}
              onChange={e => setForm({...form, term: e.target.value})}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Papers / Subjects</label>
            {papers.map((paper, idx) => (
                <div key={idx} className="flex flex-col md:flex-row gap-3 mb-3 items-end">
                    <select
                        className="px-3 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none flex-1"
                        value={paper.subjectId}
                        onChange={e => handlePaperChange(idx, 'subjectId', e.target.value)}
                        required
                    >
                        <option value="">Select Subject</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <div className="w-24">
                        <label className="text-xs text-gray-500 block">Duration (min)</label>
                        <input
                            type="number"
                            className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={paper.duration}
                            onChange={e => handlePaperChange(idx, 'duration', e.target.value)}
                        />
                    </div>
                    <div className="w-24">
                        <label className="text-xs text-gray-500 block">Marks</label>
                        <input
                            type="number"
                            className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={paper.totalMarks}
                            onChange={e => handlePaperChange(idx, 'totalMarks', e.target.value)}
                        />
                    </div>
                    <button 
                        type="button" 
                        onClick={() => removePaperRow(idx)}
                        className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg"
                        disabled={papers.length === 1}
                    >
                        ✕
                    </button>
                </div>
            ))}
            <button 
                type="button"
                onClick={addPaperRow}
                className="text-sm text-indigo-600 hover:underline font-medium mt-1"
            >
                + Add Another Subject
            </button>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
                {loading ? 'Creating...' : 'Create Exam'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {exams.length === 0 ? (
             <p className="text-gray-500 text-center py-10">No exams scheduled.</p>
        ) : (
            exams.map(exam => (
            <div key={exam.id} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h4 className="font-bold text-gray-800 text-lg">{exam.name}</h4>
                        <p className="text-sm text-gray-500">{exam.term} • {exam.year}</p>
                    </div>
                    {canEdit && (
                        <button 
                            onClick={() => handleDelete(exam.id)}
                            className="text-red-400 hover:text-red-600 px-3 py-1 rounded hover:bg-red-50"
                        >
                            Delete
                        </button>
                    )}
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3">
                    <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Papers ({exam.papers?.length || 0})</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {exam.papers?.map(paper => (
                            <div key={paper.id} className="bg-white border border-gray-200 rounded p-2 text-sm flex justify-between items-center">
                                <span className="font-medium">{paper.subject?.name}</span>
                                <span className="text-xs text-gray-500">{paper.duration} mins • {paper.totalMarks} marks</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            ))
        )}
      </div>
    </div>
  );
}
