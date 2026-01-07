import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileText, Plus, Trash2, Save, Search, ChevronRight, Edit2, Settings } from 'lucide-react';
import api from '../../utils/api';

export default function Exams() {
  const [activeTab, setActiveTab] = useState('exams'); // 'exams' or 'results'
  const location = useLocation();
  const navigate = useNavigate();
  
  // Data States
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  
  // Selection States for Results
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  
  // Results Data
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState({}); // Map studentId -> score
  const [loading, setLoading] = useState(false);
  
  // Form States
  const [newExam, setNewExam] = useState({ name: '', term: '', year: new Date().getFullYear() });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingExamId, setEditingExamId] = useState(null);

  useEffect(() => {
    fetchExams();
    fetchClasses();
    fetchSubjects();
  }, []);
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sid = params.get('subjectId') || '';
    const eid = params.get('examId') || '';
    
    if (sid) {
      setActiveTab('results');
      setSelectedSubject(sid);
      // Auto-select first exam if available and none selected
      if (exams.length > 0 && !eid && !selectedExam) {
        setSelectedExam(exams[0].id);
      }
    }
    if (eid) {
      setSelectedExam(eid);
    }
  }, [location.search, exams]); // Added exams dependency

  const fetchExams = async () => {
    try {
      const { data } = await api.get('/exams');
      setExams(data);
    } catch (error) {
      console.error('Failed to fetch exams', error);
    }
  };

  const fetchClasses = async () => {
    try {
      const { data } = await api.get('/classes');
      setClasses(data);
    } catch (error) {
      console.error('Failed to fetch classes', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const { data } = await api.get('/subjects');
      setSubjects(data);
    } catch (error) {
      console.error('Failed to fetch subjects', error);
    }
  };

  const openCreateModal = () => {
    setNewExam({ name: '', term: '', year: new Date().getFullYear() });
    setEditingExamId(null);
    setShowCreateModal(true);
  };

  const openEditModal = (exam) => {
    setNewExam({ name: exam.name, term: exam.term, year: exam.year });
    setEditingExamId(exam.id);
    setShowCreateModal(true);
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    try {
      if (editingExamId) {
        await api.put(`/exams/${editingExamId}`, newExam);
        setEditingExamId(null);
        setShowCreateModal(false);
        fetchExams();
      } else {
        const res = await api.post('/exams', newExam);
        const created = res.data;
        setNewExam({ name: '', term: '', year: new Date().getFullYear() });
        setShowCreateModal(false);
        navigate(`/exams/${created.id}/setup`);
      }
    } catch (error) {
      alert(editingExamId ? 'Failed to update exam' : 'Failed to create exam');
    }
  };

  const handleDeleteExam = async (id) => {
    if (!window.confirm('Are you sure? This will delete all results for this exam.')) return;
    try {
      await api.delete(`/exams/${id}`);
      fetchExams();
    } catch (error) {
      alert('Failed to delete exam');
    }
  };

  // Fetch data for Results view
  useEffect(() => {
    if (selectedExam && selectedClass && selectedSubject) {
      fetchResultsData();
    }
  }, [selectedExam, selectedClass, selectedSubject]);

  const fetchResultsData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Students
      const { data: studentsData } = await api.get(`/students?classId=${selectedClass}`);
      setStudents(studentsData);

      // 2. Fetch Existing Results
      const { data: resultsData } = await api.get('/exam-results', {
        params: {
          examId: selectedExam,
          classId: selectedClass,
          subjectId: selectedSubject
        }
      });

      // Map results to studentId -> score
      const resultMap = {};
      resultsData.forEach(r => {
        resultMap[r.studentId] = r.score;
      });
      setResults(resultMap);

    } catch (error) {
      console.error('Failed to fetch results data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (studentId, score) => {
    setResults(prev => ({
      ...prev,
      [studentId]: score
    }));
  };

  const saveResults = async () => {
    try {
      const resultsArray = Object.entries(results).map(([studentId, score]) => ({
        studentId,
        score
      }));

      await api.post('/exam-results', {
        examId: selectedExam,
        subjectId: selectedSubject,
        results: resultsArray
      });
      alert('Results saved successfully');
    } catch (error) {
      alert('Failed to save results');
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Exam Management</h1>
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('exams')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'exams' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Exams
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'results' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Results Entry
          </button>
        </div>
      </div>

      {activeTab === 'exams' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="font-semibold text-gray-700">Exam Schedule</h3>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              <Plus size={16} />
              New Exam
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-6 py-3 font-semibold">Exam Name</th>
                  <th className="px-6 py-3 font-semibold">Term</th>
                  <th className="px-6 py-3 font-semibold">Year</th>
                  <th className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {exams.length === 0 ? (
                  <tr><td colSpan="4" className="p-6 text-center text-gray-400">No exams found.</td></tr>
                ) : (
                  exams.map(exam => (
                    <tr key={exam.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-800">{exam.name}</td>
                      <td className="px-6 py-4 text-gray-600">{exam.term}</td>
                      <td className="px-6 py-4 text-gray-600">{exam.year}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                            <button 
                            title="Edit Details"
                            onClick={() => openEditModal(exam)}
                            className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-50"
                            >
                            <Settings size={18} />
                            </button>
                            <button 
                            title="Setup Questions"
                            onClick={() => navigate(`/exams/${exam.id}/setup`)}
                            className="text-blue-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50"
                            >
                            <FileText size={18} />
                            </button>
                            <button 
                            title="Delete Exam"
                            onClick={() => handleDeleteExam(exam.id)}
                            className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50"
                            >
                            <Trash2 size={18} />
                            </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'results' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Select Exam</label>
                <select 
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={selectedExam}
                  onChange={e => setSelectedExam(e.target.value)}
                >
                  <option value="">-- Select Exam --</option>
                  {exams.length === 0 ? (
                    <option disabled>No exams found</option>
                  ) : (
                    exams.map(e => <option key={e.id} value={e.id}>{e.name} ({e.year})</option>)
                  )}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Select Class</label>
                <select 
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={selectedClass}
                  onChange={e => setSelectedClass(e.target.value)}
                >
                  <option value="">-- Select Class --</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Select Subject</label>
                <select 
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={selectedSubject}
                  onChange={e => setSelectedSubject(e.target.value)}
                >
                  <option value="">-- Select Subject --</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
          </div>
          
          {exams.length === 0 && (
            <div className="text-center py-8 bg-white rounded-xl border border-gray-100">
               <p className="text-gray-500 mb-4">No exams have been created yet.</p>
               <button 
                 onClick={openCreateModal}
                 className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
               >
                 Create First Exam
               </button>
            </div>
          )}

          {!selectedExam && exams.length > 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
               <div className="text-gray-400">Select an exam to view results</div>
            </div>
          )}

          {selectedExam && (!selectedClass || !selectedSubject) && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
               <div className="text-gray-400">Please select Class and Subject to view students</div>
            </div>
          )}

          {selectedExam && selectedClass && selectedSubject && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-semibold text-gray-700">Student Scores</h3>
                <button
                  onClick={saveResults}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                >
                  <Save size={18} />
                  Save Results
                </button>
              </div>
              
              {loading ? (
                <div className="p-8 text-center text-gray-500">Loading students and scores...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                      <tr>
                        <th className="px-6 py-3 font-semibold">Roll No</th>
                        <th className="px-6 py-3 font-semibold">Student Name</th>
                        <th className="px-6 py-3 font-semibold w-48">Score / Marks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {students.length === 0 ? (
                        <tr><td colSpan="3" className="p-6 text-center text-gray-400">No students found in this class.</td></tr>
                      ) : (
                        students.map(student => (
                          <tr key={student.id} className="hover:bg-gray-50">
                            <td className="px-6 py-3 text-gray-600 font-mono text-sm">{student.rollNumber}</td>
                            <td className="px-6 py-3 font-medium text-gray-800">{student.name}</td>
                            <td className="px-6 py-3">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.5"
                                value={results[student.id] || ''}
                                onChange={(e) => handleScoreChange(student.id, e.target.value)}
                                className="w-full border border-gray-200 rounded px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="Enter score"
                              />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">{editingExamId ? 'Edit Exam Details' : 'Create New Exam'}</h3>
            <form onSubmit={handleCreateExam} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exam Name</label>
                <input
                  type="text"
                  required
                  value={newExam.name}
                  onChange={e => setNewExam({...newExam, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Mid-Term 2024"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
                <input
                  type="text"
                  required
                  value={newExam.term}
                  onChange={e => setNewExam({...newExam, term: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Spring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <input
                  type="number"
                  required
                  value={newExam.year}
                  onChange={e => setNewExam({...newExam, year: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingExamId ? 'Update Exam' : 'Create Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
