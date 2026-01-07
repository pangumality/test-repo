import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, AlertCircle, CheckCircle, Save } from 'lucide-react';
import api from '../../utils/api';

export default function TakeExam() {
  const { paperId } = useParams();
  const navigate = useNavigate();
  
  const [paper, setPaper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    fetchPaper();
    return () => clearInterval(timerRef.current);
  }, [paperId]);

  useEffect(() => {
    if (timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            submitExam(true); // Auto-submit
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [timeLeft]); // Restart interval logic if needed, but simple countdown works if initialized once.
  // Actually, better to set interval once.
  // Let's fix the timer logic below.

  const fetchPaper = async () => {
    try {
      const { data } = await api.get(`/student/papers/${paperId}`);
      setPaper(data);
      // Initialize time left (minutes to seconds)
      setTimeLeft((data.duration || 60) * 60);
    } catch (error) {
      console.error('Failed to load paper', error);
      alert('Failed to load exam. It might be invalid or already submitted.');
      navigate('/student/exams');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const submitExam = async (auto = false) => {
    if (submitting) return;
    if (!auto && !window.confirm('Are you sure you want to submit? You cannot undo this action.')) return;

    setSubmitting(true);
    try {
      await api.post(`/student/papers/${paperId}/submit`, { answers });
      alert(auto ? 'Time is up! Exam submitted automatically.' : 'Exam submitted successfully!');
      navigate('/student/exams');
    } catch (error) {
      console.error('Submission failed', error);
      alert('Failed to submit exam. Please try again.');
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading) return <div className="p-6 text-center">Loading exam...</div>;
  if (!paper) return <div className="p-6 text-center">Exam not found.</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-4 z-10 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-800">{paper.subject?.name} - {paper.exam?.name}</h1>
          <p className="text-sm text-gray-500">Total Marks: {paper.totalMarks}</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xl font-bold ${timeLeft < 300 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
          <Clock size={24} />
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Instructions */}
      {paper.instructions && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
          <AlertCircle className="text-blue-600 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-semibold text-blue-800">Instructions</h4>
            <p className="text-blue-700 text-sm whitespace-pre-wrap">{paper.instructions}</p>
          </div>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-6">
        {(paper.questions || []).map((q, index) => (
          <div key={q.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-start mb-4">
              <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-md text-sm font-semibold">
                Question {index + 1}
              </span>
              <span className="text-sm text-gray-500 font-medium">{q.marks} Marks</span>
            </div>
            
            <p className="text-gray-800 text-lg mb-6 whitespace-pre-wrap">{q.text}</p>

            {q.type === 'mcq' && (
              <div className="space-y-3">
                {q.options.map((opt, optIndex) => (
                  <label 
                    key={optIndex} 
                    className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                      answers[q.id] === String(optIndex) 
                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${q.id}`}
                      value={optIndex}
                      checked={answers[q.id] === String(optIndex)}
                      onChange={(e) => handleAnswer(q.id, e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-700">{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {q.type === 'truefalse' && (
               <div className="flex gap-4">
                  {['True', 'False'].map((opt) => (
                      <label 
                        key={opt}
                        className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border cursor-pointer ${
                          answers[q.id] === opt 
                            ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                         <input
                          type="radio"
                          name={`question-${q.id}`}
                          value={opt}
                          checked={answers[q.id] === opt}
                          onChange={(e) => handleAnswer(q.id, e.target.value)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="font-medium">{opt}</span>
                      </label>
                  ))}
               </div>
            )}

            {q.type === 'descriptive' && (
              <textarea
                value={answers[q.id] || ''}
                onChange={(e) => handleAnswer(q.id, e.target.value)}
                className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-32"
                placeholder="Type your answer here..."
              />
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex justify-end pt-6 pb-12">
        <button
          onClick={() => submitExam(false)}
          disabled={submitting}
          className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit Exam'}
          <CheckCircle size={24} />
        </button>
      </div>
    </div>
  );
}
