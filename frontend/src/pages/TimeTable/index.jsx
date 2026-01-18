import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Trash2, User, Pencil } from 'lucide-react';
import api from '../../utils/api';

const TimeTable = () => {
  const { currentUser } = useOutletContext();
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    classId: '',
    subjectId: '',
    teacherId: '',
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '09:45'
  });
  const [activePeriod, setActivePeriod] = useState(null);
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [isEditingPeriod, setIsEditingPeriod] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: '',
    classId: '',
    subjectId: '',
    teacherId: '',
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '09:45'
  });

  const canManage = ['admin', 'school_admin'].includes(currentUser?.role);
  const isTeacher = currentUser?.role === 'teacher';

  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const WORK_DAYS = [1, 2, 3, 4, 5];

  useEffect(() => {
    fetchTimetable();
    if (canManage) {
      fetchMetadata();
    }
  }, [selectedClassId]);

  const fetchMetadata = async () => {
    try {
      const [classRes, subjectRes, teacherRes] = await Promise.all([
        api.get('/classes'),
        api.get('/subjects'),
        api.get('/teachers')
      ]);
      setClasses(classRes.data);
      setSubjects(subjectRes.data);
      setTeachers(teacherRes.data);
    } catch (error) {
      console.error('Failed to fetch metadata');
    }
  };

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedClassId) params.classId = selectedClassId;

      const response = await api.get('/timetable', { params });
      setTimetable(response.data);
    } catch (error) {
      console.error('Failed to fetch timetable:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPeriod = async (e) => {
    e.preventDefault();
    try {
      await api.post('/timetable', formData);
      setShowAddModal(false);
      fetchTimetable();
    } catch (error) {
      alert('Failed to add period');
    }
  };

  const handleUpdatePeriod = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/timetable/${editFormData.id}`, {
        classId: editFormData.classId,
        subjectId: editFormData.subjectId,
        teacherId: editFormData.teacherId,
        dayOfWeek: editFormData.dayOfWeek,
        startTime: editFormData.startTime,
        endTime: editFormData.endTime
      });
      setShowPeriodModal(false);
      setIsEditingPeriod(false);
      setActivePeriod(null);
      fetchTimetable();
    } catch (error) {
      alert('Failed to update period');
    }
  };

  const handleDeletePeriod = async (id) => {
    if (!window.confirm('Are you sure you want to delete this period?')) {
      return;
    }
    try {
      await api.delete(`/timetable/${id}`);
      if (activePeriod && activePeriod.id === id) {
        setShowPeriodModal(false);
        setIsEditingPeriod(false);
        setActivePeriod(null);
      }
      fetchTimetable();
    } catch (error) {
      alert('Failed to delete period');
    }
  };

  const getPeriodsForDay = (dayIndex) => {
    return timetable.filter(t => t.dayOfWeek === dayIndex);
  };

  const openPeriodModalForView = (period) => {
    setActivePeriod(period);
    setIsEditingPeriod(false);
    setEditFormData({
      id: period.id,
      classId: period.classId,
      subjectId: period.subjectId,
      teacherId: period.teacherId,
      dayOfWeek: period.dayOfWeek,
      startTime: period.startTime,
      endTime: period.endTime
    });
    setShowPeriodModal(true);
  };

  const openPeriodModalForEdit = (period) => {
    setActivePeriod(period);
    setIsEditingPeriod(true);
    setEditFormData({
      id: period.id,
      classId: period.classId,
      subjectId: period.subjectId,
      teacherId: period.teacherId,
      dayOfWeek: period.dayOfWeek,
      startTime: period.startTime,
      endTime: period.endTime
    });
    setShowPeriodModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Time Table</h1>
          <p className="text-gray-500">
            {isTeacher ? 'My Schedule' : 'Class Schedule'}
          </p>
        </div>
        <div className="flex gap-4">
          {canManage && (
            <>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="border rounded-lg px-3 py-2 bg-white"
              >
                <option value="">Select Class...</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
                ))}
              </select>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                <Plus size={20} /> Add Period
              </button>
            </>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Add Time Table Period</h2>
            <form onSubmit={handleAddPeriod} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Class</label>
                <select
                  required
                  value={formData.classId}
                  onChange={(e) => setFormData({...formData, classId: e.target.value})}
                  className="w-full border rounded-lg p-2"
                >
                  <option value="">Select Class</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Subject</label>
                  <select
                    required
                    value={formData.subjectId}
                    onChange={(e) => setFormData({...formData, subjectId: e.target.value})}
                    className="w-full border rounded-lg p-2"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Teacher</label>
                  <select
                    required
                    value={formData.teacherId}
                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                    className="w-full border rounded-lg p-2"
                  >
                    <option value="">Select Teacher</option>
                    {teachers
                      .filter(t => t.teacherId)
                      .map(t => (
                        <option key={t.id} value={t.teacherId}>
                          {t.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Day</label>
                <select
                  required
                  value={formData.dayOfWeek}
                  onChange={(e) => setFormData({...formData, dayOfWeek: e.target.value})}
                  className="w-full border rounded-lg p-2"
                >
                  {WORK_DAYS.map(day => (
                    <option key={day} value={day}>{DAYS[day]}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  Add to Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {WORK_DAYS.map(day => (
          <div key={day} className="bg-white rounded-xl shadow-sm border p-4">
            <h3 className="font-bold text-lg mb-3 pb-2 border-b text-center text-gray-700">
              {DAYS[day]}
            </h3>
            <div className="space-y-3">
              {getPeriodsForDay(day).length === 0 ? (
                <p className="text-sm text-gray-400 text-center italic py-4">No classes</p>
              ) : (
                getPeriodsForDay(day).map(period => (
                  <div
                    key={period.id}
                    className="bg-blue-50 p-3 rounded-lg border border-blue-100 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => openPeriodModalForView(period)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-blue-900">{period.subject?.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-white px-1.5 py-0.5 rounded text-blue-600 font-mono border border-blue-200">
                          {period.startTime}
                        </span>
                        {canManage && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openPeriodModalForEdit(period);
                              }}
                              className="p-1 rounded hover:bg-blue-100 text-blue-700"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePeriod(period.id);
                              }}
                              className="p-1 rounded hover:bg-red-100 text-red-600"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 flex items-center gap-1 mb-1">
                      <User size={14} />
                      {period.teacher?.user?.firstName} {period.teacher?.user?.lastName?.charAt(0)}.
                    </div>
                    {isTeacher && (
                      <div className="text-xs text-gray-500 mt-1 pt-1 border-t border-blue-100">
                        Class: {period.klass?.name}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {showPeriodModal && activePeriod && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {isEditingPeriod ? 'Edit Period' : 'Period Details'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowPeriodModal(false);
                  setIsEditingPeriod(false);
                  setActivePeriod(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {isEditingPeriod ? (
              <form onSubmit={handleUpdatePeriod} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Class</label>
                  <select
                    required
                    value={editFormData.classId}
                    onChange={(e) => setEditFormData({ ...editFormData, classId: e.target.value })}
                    className="w-full border rounded-lg p-2"
                  >
                    <option value="">Select Class</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Subject</label>
                    <select
                      required
                      value={editFormData.subjectId}
                      onChange={(e) => setEditFormData({ ...editFormData, subjectId: e.target.value })}
                      className="w-full border rounded-lg p-2"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Teacher</label>
                    <select
                      required
                      value={editFormData.teacherId}
                      onChange={(e) => setEditFormData({ ...editFormData, teacherId: e.target.value })}
                      className="w-full border rounded-lg p-2"
                    >
                      <option value="">Select Teacher</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>{t.user?.firstName} {t.user?.lastName}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Day</label>
                  <select
                    required
                    value={editFormData.dayOfWeek}
                    onChange={(e) => setEditFormData({ ...editFormData, dayOfWeek: e.target.value })}
                    className="w-full border rounded-lg p-2"
                  >
                    {WORK_DAYS.map(day => (
                      <option key={day} value={day}>{DAYS[day]}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Time</label>
                    <input
                      type="time"
                      required
                      value={editFormData.startTime}
                      onChange={(e) => setEditFormData({ ...editFormData, startTime: e.target.value })}
                      className="w-full border rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">End Time</label>
                    <input
                      type="time"
                      required
                      value={editFormData.endTime}
                      onChange={(e) => setEditFormData({ ...editFormData, endTime: e.target.value })}
                      className="w-full border rounded-lg p-2"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingPeriod(false);
                      if (activePeriod) {
                        setEditFormData({
                          id: activePeriod.id,
                          classId: activePeriod.classId,
                          subjectId: activePeriod.subjectId,
                          teacherId: activePeriod.teacherId,
                          dayOfWeek: activePeriod.dayOfWeek,
                          startTime: activePeriod.startTime,
                          endTime: activePeriod.endTime
                        });
                      }
                    }}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500">Subject</div>
                  <div className="text-base font-semibold text-gray-800">
                    {activePeriod.subject?.name}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Teacher</div>
                  <div className="text-base text-gray-800 flex items-center gap-2">
                    <User size={16} />
                    {activePeriod.teacher?.user?.firstName} {activePeriod.teacher?.user?.lastName}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Day</div>
                    <div className="text-base font-medium text-gray-800">
                      {DAYS[activePeriod.dayOfWeek]}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Time</div>
                    <div className="text-base font-mono text-gray-800">
                      {activePeriod.startTime} - {activePeriod.endTime}
                    </div>
                  </div>
                </div>
                {activePeriod.klass && (
                  <div>
                    <div className="text-sm text-gray-500">Class</div>
                    <div className="text-base font-medium text-gray-800">
                      {activePeriod.klass.name}{activePeriod.klass.section ? ` - ${activePeriod.klass.section}` : ''}
                    </div>
                  </div>
                )}
                {canManage && (
                  <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setIsEditingPeriod(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-teal-600 text-teal-700 hover:bg-teal-50"
                    >
                      <Pencil size={16} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePeriod(activePeriod.id)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-600 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeTable;
