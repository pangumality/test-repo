import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, CheckCircle, PlayCircle, Award, RotateCw } from 'lucide-react';
import api from '../../utils/api';

export default function StudentExams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const { data } = await api.get('/student/exams');
      setExams(data);
    } catch (error) {
      console.error('Failed to fetch exams', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">My Exams</h1>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading exams...</div>
      ) : exams.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <FileText size={32} />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">No Exams Available</h3>
          <p className="text-gray-500 mt-2">There are no exams scheduled for you at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((paper) => (
            <div key={paper.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">{paper.subject?.name}</h3>
                    <p className="text-sm text-gray-500">{paper.exam?.name} ({paper.exam?.term})</p>
                  </div>
                  <div className={`p-2 rounded-lg ${paper.submitted ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                    {paper.submitted ? <CheckCircle size={20} /> : <FileText size={20} />}
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock size={16} className="text-gray-400" />
                    <span>{paper.duration} Minutes</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Award size={16} className="text-gray-400" />
                    <span>{paper.totalMarks} Marks</span>
                  </div>
                </div>

                {paper.submitted ? (
                  <div className="mt-4 pt-4 border-t border-gray-50">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-medium text-gray-500">Your Score</span>
                        <span className="text-lg font-bold text-green-600">{paper.score} / {paper.totalMarks}</span>
                    </div>
                    <button
                        onClick={() => navigate(`/student/exams/${paper.id}/take`)}
                        className="w-full flex items-center justify-center gap-2 py-2 bg-white border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm"
                    >
                        <RotateCw size={16} />
                        Retake Exam
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => navigate(`/student/exams/${paper.id}/take`)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <PlayCircle size={18} />
                    Start Exam
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
