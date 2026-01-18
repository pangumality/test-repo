import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import api from '../../utils/api';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  CreditCard, 
  Award,
  Clock,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  User
} from 'lucide-react';
import clsx from 'clsx';

const ParentDashboard = () => {
  const { formatCurrencyFromBase } = useOutletContext() || {};

  const formatCurrency = (amount) => {
    if (typeof formatCurrencyFromBase === 'function') {
      return formatCurrencyFromBase(amount);
    }
    const numeric = Number(amount || 0);
    return `ZMW ${numeric.toLocaleString()}`;
  };
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [childData, setChildData] = useState({
    overview: null,
    attendance: null,
    results: null,
    fees: null
  });
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      fetchChildDetails(selectedChild.id);
    }
  }, [selectedChild]);

  const fetchChildren = async () => {
    try {
      const response = await api.get('/parents/children');
      setChildren(response.data);
      if (response.data.length > 0) {
        setSelectedChild(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching children:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChildDetails = async (studentId) => {
    setLoadingDetails(true);
    try {
      const [overviewRes, attendanceRes, resultsRes, feesRes] = await Promise.all([
        api.get(`/parents/children/${studentId}/overview`),
        api.get(`/parents/children/${studentId}/attendance`),
        api.get(`/parents/children/${studentId}/results`),
        api.get(`/parents/children/${studentId}/fees`)
      ]);

      setChildData({
        overview: overviewRes.data,
        attendance: attendanceRes.data,
        results: resultsRes.data,
        fees: feesRes.data
      });
    } catch (error) {
      console.error('Error fetching child details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <Users size={48} className="mb-4" />
        <h2 className="text-xl font-semibold">No Children Linked</h2>
        <p>There are no students linked to your parent account.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header & Child Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Parent Portal</h1>
          <p className="text-slate-500 mt-1">Monitor your child's progress and school activities</p>
        </div>
        
        <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {children.map(child => (
            <button
              key={child.id}
              onClick={() => setSelectedChild(child)}
              className={clsx(
                "flex items-center gap-3 px-5 py-3 rounded-xl border transition-all duration-300 whitespace-nowrap group",
                selectedChild?.id === child.id
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-transparent shadow-lg shadow-blue-200 scale-105"
                  : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:shadow-md"
              )}
            >
              <div className={clsx(
                "p-1.5 rounded-full transition-colors",
                selectedChild?.id === child.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-500"
              )}>
                <User size={16} />
              </div>
              <div className="text-left">
                <div className="font-bold text-sm leading-none mb-1">{child.name}</div>
                <div className={clsx("text-xs font-medium", selectedChild?.id === child.id ? "text-blue-100" : "text-slate-400")}>
                  Class {child.class}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {loadingDetails ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Academic Overview Card */}
          <Link to="/dashboard/subjects" className="bg-white p-6 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-100 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 block">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-400 opacity-10 rounded-bl-full -mr-6 -mt-6 transition-transform group-hover:scale-110" />
            
            <div className="flex items-center justify-between mb-6 relative">
              <h3 className="font-bold text-slate-700 flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg text-white shadow-lg shadow-blue-500/30">
                  <BookOpen size={20} />
                </div>
                Academic Overview
              </h3>
            </div>
            <div className="space-y-4 relative">
              <div className="flex justify-between items-center py-3 border-b border-slate-50">
                <span className="text-slate-500 text-sm font-medium">Class Teacher</span>
                <span className="font-bold text-slate-700">{childData.overview?.classTeacher?.user?.firstName || 'Not Assigned'}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-50">
                <span className="text-slate-500 text-sm font-medium">Total Subjects</span>
                <span className="font-bold text-slate-700">{childData.overview?.subjects?.length || 0}</span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Enrolled Subjects</p>
                <div className="flex flex-wrap gap-2">
                  {childData.overview?.subjects?.map(sub => (
                    <span key={sub.id} className="px-2.5 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-md border border-blue-100">
                      {sub.name}
                    </span>
                  )) || <span className="text-slate-400 text-sm">No subjects enrolled</span>}
                </div>
              </div>
            </div>
          </Link>

          {/* Attendance Card */}
          <Link to="/dashboard/attendance" className="bg-white p-6 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-100 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 block">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-400 opacity-10 rounded-bl-full -mr-6 -mt-6 transition-transform group-hover:scale-110" />
            
            <div className="flex items-center justify-between mb-6 relative">
              <h3 className="font-bold text-slate-700 flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-lg text-white shadow-lg shadow-emerald-500/30">
                  <Calendar size={20} />
                </div>
                Attendance
              </h3>
              <span className={clsx(
                "px-3 py-1 rounded-full text-xs font-bold shadow-sm border",
                (childData.attendance?.percentage || 0) >= 75 
                  ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                  : "bg-rose-50 text-rose-600 border-rose-100"
              )}>
                {childData.attendance?.percentage?.toFixed(1) || 0}%
              </span>
            </div>
            
            <div className="space-y-5 relative">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-xl font-black text-slate-800">{childData.attendance?.summary?.present || 0}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Present</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-xl font-black text-slate-800">{childData.attendance?.summary?.absent || 0}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Absent</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-xl font-black text-slate-800">{childData.attendance?.summary?.late || 0}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Late</div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recent History</p>
                {childData.attendance?.recent?.slice(0, 3).map((record, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm p-2 hover:bg-slate-50 rounded-lg transition-colors">
                    <span className="text-slate-600 font-medium">{new Date(record.date).toLocaleDateString()}</span>
                    <span className={clsx(
                      "text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wide",
                      record.status === 'present' ? "bg-emerald-100 text-emerald-700" :
                      record.status === 'absent' ? "bg-rose-100 text-rose-700" :
                      "bg-amber-100 text-amber-700"
                    )}>
                      {record.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Link>

          {/* Fees Card */}
          <Link to="/finance" className="bg-white p-6 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-100 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 block">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-violet-500 to-purple-500 opacity-10 rounded-bl-full -mr-6 -mt-6 transition-transform group-hover:scale-110" />
            
            <div className="flex items-center justify-between mb-6 relative">
              <h3 className="font-bold text-slate-700 flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg text-white shadow-lg shadow-violet-500/30">
                  <CreditCard size={20} />
                </div>
                Fees Status
              </h3>
              {childData.fees?.outstanding > 0 ? (
                <span className="flex items-center gap-1.5 text-rose-500 text-xs font-bold bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                  <AlertCircle size={14} /> Due
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-emerald-500 text-xs font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                  <CheckCircle size={14} /> Paid
                </span>
              )}
            </div>
            
            <div className="space-y-5 relative">
              <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-5 rounded-xl border border-violet-100 flex justify-between items-center">
                <span className="text-violet-700 font-bold text-sm">Outstanding</span>
                <span className="text-2xl font-black text-violet-800">
                  {formatCurrency(childData.fees?.outstanding || 0)}
                </span>
              </div>
              
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recent Transactions</p>
                {childData.fees?.history?.length > 0 ? (
                  childData.fees.history.slice(0, 3).map((tx, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm p-2 hover:bg-slate-50 rounded-lg transition-colors">
                      <div>
                        <div className="font-bold text-slate-700">{tx.description || 'Fee Payment'}</div>
                        <div className="text-xs text-slate-400 font-medium">{new Date(tx.date).toLocaleDateString()}</div>
                      </div>
                      <span className="font-bold text-slate-800 bg-white px-2 py-1 rounded border border-slate-100 shadow-sm">
                        {formatCurrency(tx.amount)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 italic p-2">No recent transactions</p>
                )}
              </div>
            </div>
          </Link>

          {/* Results Card */}
          <Link to="/dashboard/exams" className="md:col-span-2 lg:col-span-3 bg-white p-6 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-100 relative overflow-hidden block">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-700 flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg text-white shadow-lg shadow-orange-500/30">
                  <Award size={20} />
                </div>
                Recent Results
              </h3>
              <span className="text-sm text-indigo-600 hover:text-indigo-700 font-bold bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors">View All Results</span>
            </div>
            
            {childData.results?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-separate border-spacing-y-2">
                  <thead className="text-slate-400 font-bold text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-4 pb-2">Exam</th>
                      <th className="px-4 pb-2">Subject</th>
                      <th className="px-4 pb-2">Score</th>
                      <th className="px-4 pb-2">Grade</th>
                      <th className="px-4 pb-2 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {childData.results.map((result, idx) => (
                      <tr key={idx} className="bg-slate-50 hover:bg-white hover:shadow-md transition-all duration-200 group">
                        <td className="px-4 py-4 font-bold text-slate-700 rounded-l-xl border-y border-l border-slate-100 group-hover:border-indigo-100">{result.examName}</td>
                        <td className="px-4 py-4 font-medium text-slate-600 border-y border-slate-100 group-hover:border-indigo-100">{result.subjectName}</td>
                        <td className="px-4 py-4 font-bold text-slate-800 border-y border-slate-100 group-hover:border-indigo-100">
                          {result.marksObtained}<span className="text-slate-400 text-xs font-normal">/{result.totalMarks}</span>
                        </td>
                        <td className="px-4 py-4 border-y border-slate-100 group-hover:border-indigo-100">
                          <span className={clsx(
                            "px-2.5 py-1 rounded-md text-xs font-bold shadow-sm border",
                            result.grade === 'A' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                            result.grade === 'B' ? "bg-blue-50 text-blue-600 border-blue-100" :
                            result.grade === 'C' ? "bg-amber-50 text-amber-600 border-amber-100" :
                            "bg-rose-50 text-rose-600 border-rose-100"
                          )}>
                            {result.grade}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-400 text-right rounded-r-xl border-y border-r border-slate-100 group-hover:border-indigo-100 font-medium">{new Date(result.date).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                   <TrendingUp size={28} className="text-slate-300" />
                </div>
                <p className="font-medium">No exam results available yet.</p>
              </div>
            )}
          </Link>

        </div>
      )}
    </div>
  );
};

export default ParentDashboard;
