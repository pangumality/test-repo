import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { Plus, Trash2, Save, ArrowLeft, Send } from 'lucide-react';
import api from '../../utils/api';

export default function ExamSetup() {
  const { examId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // State for Subject Selection
  const [subjectId, setSubjectId] = useState(new URLSearchParams(location.search).get('subjectId') || '');
  const [subjects, setSubjects] = useState([]);

  const [exam, setExam] = useState(null);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [totalMarks, setTotalMarks] = useState(100);
  const [instructions, setInstructions] = useState('');
  const [questions, setQuestions] = useState([]);
  const [status, setStatus] = useState('draft');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, [examId]);

  useEffect(() => {
    if (examId && subjectId) {
      loadPaper();
    }
  }, [examId, subjectId]);

  const fetchInitialData = async () => {
    try {
      // Load Exam Details
      const { data: exams } = await api.get('/exams');
      const found = (exams || []).find(e => e.id === examId);
      setExam(found || null);

      // Load Subjects
      const { data: subs } = await api.get('/subjects');
      setSubjects(subs);
    } catch (error) {
      console.error('Failed to load initial data', error);
    }
  };

  const loadPaper = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/exams/${examId}/papers/${subjectId}`);
      if (data) {
        setDurationMinutes(data.duration || 60);
        setTotalMarks(data.totalMarks || 100);
        setInstructions(data.instructions || '');
        setQuestions(data.questions || []);
        setStatus(data.status || 'draft');
      } else {
        // Reset to defaults if no paper exists
        setDurationMinutes(60);
        setTotalMarks(100);
        setInstructions('');
        setQuestions([]);
        setStatus('draft');
      }
    } catch (error) {
      console.error('Failed to load paper', error);
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => {
    setQuestions(qs => [
      ...qs,
      { id: crypto.randomUUID(), type: 'mcq', text: '', options: ['', '', '', ''], correctIndex: 0, marks: 1 }
    ]);
  };

  const updateQuestion = (id, patch) => {
    setQuestions(qs => qs.map(q => (q.id === id ? { ...q, ...patch } : q)));
  };

  const removeQuestion = (id) => {
    setQuestions(qs => qs.filter(q => q.id !== id));
  };

  const saveSetup = async (newStatus = 'draft') => {
    if (!subjectId) {
      alert('Please select a subject first.');
      return;
    }

    try {
      const payload = {
        subjectId,
        duration: durationMinutes,
        totalMarks,
        instructions,
        questions,
        status: newStatus
      };
      
      await api.post(`/exams/${examId}/papers`, payload);
      setStatus(newStatus);
      alert(`Exam paper ${newStatus === 'published' ? 'published' : 'saved'} successfully!`);
      
      if (newStatus === 'published') {
          navigate('/exams');
      }
    } catch (error) {
      console.error('Failed to save', error);
      alert('Failed to save exam paper');
    }
  };

  const computedTotal = questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);

  if (!exam) return <div className="p-6">Loading exam details...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Link to={`/dashboard/exams`} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200">
            <ArrowLeft size={16} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Exam Setup: {exam.name}</h1>
        </div>
        <div className="flex gap-2">
            <button
            onClick={() => saveSetup('draft')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
            >
            <Save size={18} />
            Save Draft
            </button>
            <button
            onClick={() => saveSetup('published')}
            className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg ${status === 'published' ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
            <Send size={18} />
            {status === 'published' ? 'Update & Publish' : 'Publish Exam'}
            </button>
        </div>
      </div>

      {/* Subject Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
        <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="w-full md:w-1/3 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            disabled={loading}
        >
            <option value="">-- Select Subject --</option>
            {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
            ))}
        </select>
        {!subjectId && <p className="text-sm text-amber-600 mt-2">Please select a subject to start setting up the exam paper.</p>}
      </div>

      {subjectId && (
        <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Duration (minutes)</label>
                    <input
                    type="number"
                    min="1"
                    value={durationMinutes}
                    onChange={e => setDurationMinutes(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Total Marks</label>
                    <input
                    type="number"
                    min="1"
                    value={totalMarks}
                    onChange={e => setTotalMarks(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                    />
                </div>
                 <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Status</label>
                    <div className={`px-3 py-2 rounded-lg inline-block font-medium ${status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {status.toUpperCase()}
                    </div>
                </div>
                </div>
                <div className="mt-4">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Instructions</label>
                <textarea
                    value={instructions}
                    onChange={e => setInstructions(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg h-24"
                    placeholder="Write instructions for candidates..."
                />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-700">Questions</h3>
                <button
                    onClick={addQuestion}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                    <Plus size={16} />
                    Add Question
                </button>
                </div>

                {questions.length === 0 ? (
                <div className="text-gray-500">No questions added yet.</div>
                ) : (
                <div className="space-y-4">
                    {questions.map((q, qIndex) => (
                    <div key={q.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between mb-2">
                             <span className="font-semibold text-gray-500">Q{qIndex + 1}</span>
                             <button
                                onClick={() => removeQuestion(q.id)}
                                className="text-red-500 hover:text-red-700"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-start">
                        <div className="md:col-span-4">
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Question Text</label>
                            <textarea
                            value={q.text}
                            onChange={e => updateQuestion(q.id, { text: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg h-24"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Type</label>
                            <select
                            value={q.type}
                            onChange={e => updateQuestion(q.id, { type: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                            >
                            <option value="mcq">Multiple Choice</option>
                            <option value="descriptive">Descriptive</option>
                            <option value="truefalse">True/False</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Marks</label>
                            <input
                            type="number"
                            min="0"
                            value={q.marks}
                            onChange={e => updateQuestion(q.id, { marks: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                            />
                        </div>
                        </div>

                        {q.type === 'mcq' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                            {q.options.map((opt, idx) => (
                            <div key={idx}>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Option {idx + 1}</label>
                                <input
                                type="text"
                                value={opt}
                                onChange={e => {
                                    const next = [...q.options];
                                    next[idx] = e.target.value;
                                    updateQuestion(q.id, { options: next });
                                }}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                                />
                            </div>
                            ))}
                            <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Correct Option</label>
                            <select
                                value={q.correctIndex}
                                onChange={e => updateQuestion(q.id, { correctIndex: parseInt(e.target.value) || 0 })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                            >
                                {[0,1,2,3].map(i => <option key={i} value={i}>Option {i+1}</option>)}
                            </select>
                            </div>
                        </div>
                        )}
                    </div>
                    ))}
                </div>
                )}

                <div className="mt-4 text-sm text-gray-600">
                Computed total marks: {computedTotal}
                </div>
            </div>
        </>
      )}
    </div>
  );
}
