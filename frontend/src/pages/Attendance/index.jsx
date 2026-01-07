import React, { useEffect, useMemo, useRef, useState } from 'react';
import api from '../../utils/api';

function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function storageKey(date, klass) {
  return `attendance:doonites:${date}:${klass}`;
}

export default function Attendance() {
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [date, setDate] = useState(todayStr);
  
  // State for fetched data
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [fetchError, setFetchError] = useState('');

  const [klass, setKlass] = useState('');
  const [search, setSearch] = useState('');
  const [records, setRecords] = useState({});
  const [locStatus, setLocStatus] = useState('idle');
  const [position, setPosition] = useState(null);
  const [distance, setDistance] = useState(null);
  const [locError, setLocError] = useState('');
  const watchIdRef = useRef(null);
  const [school, setSchool] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  // Fetch Classes on Mount (authenticated)
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const { data } = await api.get('/classes');
        setClasses(data);
        if (data.length > 0) {
          setKlass(data[0].id);
        }
      } catch (err) {
        console.error(err);
        setFetchError('Error loading classes. Please login and check backend connection.');
      } finally {
        setLoadingClasses(false);
      }
    };
    loadClasses();
  }, []);

  // Fetch Students when Class changes (authenticated)
  useEffect(() => {
    if (!klass) return;
    const loadStudents = async () => {
      setLoadingStudents(true);
      try {
        const { data } = await api.get(`/students?classId=${klass}`);
        setStudents(data);
      } catch (err) {
        console.error(err);
        setStudents([]);
      } finally {
        setLoadingStudents(false);
      }
    };
    loadStudents();
  }, [klass]);

  useEffect(() => {
    if (!klass) return;
    api
      .get(`/classes/${klass}/school`)
      .then(({ data }) => setSchool(data))
      .catch(err => {
        console.error(err);
        setSchool(null);
      });
  }, [klass]);

  const currentKey = storageKey(date, klass);
  
  const currentStudents = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const saved = localStorage.getItem(currentKey);
    setRecords(saved ? JSON.parse(saved) : {});
  }, [currentKey]);

  useEffect(() => {
    if (!klass || !date) return;
    setSaveError('');
    setSaveSuccess('');
    api
      .get(`/attendance?classId=${klass}&date=${date}`)
      .then(({ data }) => {
        if (!Array.isArray(data) || data.length === 0) return;
        const next = {};
        data.forEach(r => {
          if (!r?.studentId || !r?.status) return;
          next[r.studentId] = r.status === 'present' ? 'P' : r.status === 'absent' ? 'A' : undefined;
        });
        setRecords(prev => ({ ...prev, ...next }));
      })
      .catch(() => {});
  }, [klass, date]);

  useEffect(() => {
    localStorage.setItem(currentKey, JSON.stringify(records));
  }, [records, currentKey]);

  const presentCount = Object.values(records).filter(v => v === 'P').length;
  const absentCount = Object.values(records).filter(v => v === 'A').length;
  const unmarkedCount = currentStudents.length - presentCount - absentCount;

  const checkLocation = () => {
    setLocError('');
    if (!school) {
      setLocStatus('blocked');
      setLocError('No assigned school coordinates for this class.');
      return;
    }

    if (!Number.isFinite(school.lat) || !Number.isFinite(school.lng) || !Number.isFinite(school.radiusMeters)) {
      setLocStatus('allowed');
      setLocError('School location not configured. Location check skipped.');
      return;
    }

    if (!navigator.geolocation) {
      setLocStatus('error');
      setLocError('Geolocation not supported');
      return;
    }

    setLocStatus('checking');
    
    // Clear existing watch if any
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setPosition({ latitude, longitude, accuracy });

        const d = haversineDistance(latitude, longitude, school.lat, school.lng);
        setDistance(Math.round(d));

        // Logic: if useAccuracyBuffer is true, we subtract accuracy from distance to be lenient.
        // But user requirement is strict 3m. So we ignore accuracy buffer or assume standard.
        // "disable the attendance reigiter once the student goes beyond 3 meters"
        // Strict check: distance <= radius
        
        if (d <= school.radiusMeters) {
          setLocStatus('allowed');
        } else {
          setLocStatus('blocked');
        }
      },
      (err) => {
        console.error(err);
        if (err.code === 1) setLocStatus('permission_denied');
        else setLocStatus('error');
        setLocError(err.message || 'Location error');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Cleanup watch on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const toggleStatus = (studentId) => {
    if (locStatus !== 'allowed') {
      alert("You must be at the school location to mark attendance.");
      return;
    }
    setRecords(prev => {
      const current = prev[studentId];
      const next = current === 'P' ? 'A' : current === 'A' ? undefined : 'P';
      if (next === undefined) {
        const copy = { ...prev };
        delete copy[studentId];
        return copy;
      }
      return { ...prev, [studentId]: next };
    });
  };

  const markAll = (status) => {
    if (locStatus !== 'allowed') {
      alert("You must be at the school location to mark attendance.");
      return;
    }
    const newRecords = { ...records };
    currentStudents.forEach(s => {
      newRecords[s.id] = status;
    });
    setRecords(newRecords);
  };

  const inferredGrade = useMemo(() => {
    const fromStudent = students.find(s => s.grade)?.grade;
    if (fromStudent) return `${fromStudent}`;
    const klassName = classes.find(c => c.id === klass)?.name || '';
    const m = klassName.match(/\b(\d{1,2})\b/);
    return m ? m[1] : '';
  }, [students, classes, klass]);

  const saveAttendance = async () => {
    if (locStatus !== 'allowed') {
      alert('You must be at the school location to mark attendance.');
      return;
    }
    setSaving(true);
    setSaveError('');
    setSaveSuccess('');
    try {
      const payload = {
        classId: klass,
        date,
        grade: inferredGrade || undefined,
        records: Object.entries(records)
          .filter(([, v]) => v === 'P' || v === 'A')
          .map(([studentId, v]) => ({
            studentId,
            status: v === 'P' ? 'present' : 'absent',
          })),
      };

      await api.post('/attendance', payload);
      setSaveSuccess('Attendance saved.');
      localStorage.removeItem(currentKey);
    } catch (err) {
      setSaveError(err?.response?.data?.error || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-xl font-bold text-gray-700 uppercase">Attendance</h2>
        
        {/* Location Status Badge */}
        <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-lg shadow-sm">
          <div className={`w-3 h-3 rounded-full ${
            locStatus === 'allowed' ? 'bg-green-500' :
            locStatus === 'blocked' ? 'bg-red-500' :
            locStatus === 'checking' ? 'bg-yellow-500 animate-pulse' :
            'bg-gray-400'
          }`} />
          <div className="text-sm">
            {locStatus === 'allowed' && <span className="text-green-700 font-medium">Location Verified</span>}
            {locStatus === 'blocked' && <span className="text-red-700 font-medium">Out of Bounds ({distance}m)</span>}
            {locStatus === 'checking' && <span className="text-yellow-700">Locating...</span>}
            {locStatus === 'idle' && <span className="text-gray-500">Location Check Required</span>}
            {(locStatus === 'error' || locStatus === 'permission_denied') && <span className="text-red-600">Loc Error</span>}
          </div>
          {distance !== null && locStatus !== 'allowed' && (
             <span className="text-xs text-gray-400">Target: {school?.radiusMeters}m</span>
          )}
          {locStatus === 'idle' && (
            <button 
              onClick={checkLocation}
              className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
            >
              Enable
            </button>
          )}
        </div>
      </div>

      {locError && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
          {locError}
        </div>
      )}

      {fetchError && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
          {fetchError}
        </div>
      )}

      {saveError && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
          {saveError}
        </div>
      )}

      {saveSuccess && (
        <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm">
          {saveSuccess}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-soft p-6">
        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Date</label>
            <input
              type="date"
              className="w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-gray-400"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Class</label>
            <select
              className="w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-gray-400"
              value={klass}
              onChange={(e) => setKlass(e.target.value)}
              disabled={loadingClasses}
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Search</label>
            <div className="relative">
              <input
                type="text"
                className="w-full border border-gray-200 rounded-md pl-9 pr-3 py-2 focus:outline-none focus:border-gray-400"
                placeholder="Student name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 mb-6 text-sm">
          <div className="px-3 py-1 rounded-full bg-green-100 text-green-700">
            Present: <b>{presentCount}</b>
          </div>
          <div className="px-3 py-1 rounded-full bg-red-100 text-red-700">
            Absent: <b>{absentCount}</b>
          </div>
          <div className="px-3 py-1 rounded-full bg-gray-100 text-gray-600">
            Unmarked: <b>{unmarkedCount}</b>
          </div>
          <div className="ml-auto flex gap-2">
            <button
              onClick={saveAttendance}
              disabled={saving || locStatus !== 'allowed'}
              className={`text-xs px-3 py-1 rounded border ${
                locStatus === 'allowed' && !saving
                  ? 'border-blue-200 text-blue-700 hover:bg-blue-50'
                  : 'border-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button 
              onClick={() => markAll('P')}
              disabled={locStatus !== 'allowed'}
              className={`text-xs px-3 py-1 rounded border ${
                locStatus === 'allowed' 
                ? 'border-green-200 text-green-700 hover:bg-green-50' 
                : 'border-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Mark All Present
            </button>
            <button 
              onClick={() => markAll('A')}
              disabled={locStatus !== 'allowed'}
              className={`text-xs px-3 py-1 rounded border ${
                locStatus === 'allowed'
                ? 'border-red-200 text-red-700 hover:bg-red-50'
                : 'border-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Mark All Absent
            </button>
          </div>
        </div>

        {/* List */}
        {loadingStudents ? (
          <div className="text-center py-8 text-gray-500">Loading students...</div>
        ) : (
          <div className="border border-gray-100 rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 font-semibold">Student Name</th>
                  <th className="px-4 py-3 font-semibold text-center w-32">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentStudents.length === 0 ? (
                  <tr>
                    <td colSpan="2" className="px-4 py-8 text-center text-gray-400">
                      No students found in this class.
                    </td>
                  </tr>
                ) : (
                  currentStudents.map(student => {
                    const status = records[student.id];
                    return (
                      <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-700">{student.name}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => toggleStatus(student.id)}
                            disabled={locStatus !== 'allowed'}
                            className={`w-24 py-1 rounded-md text-sm font-medium transition-all ${
                              status === 'P'
                                ? 'bg-green-500 text-white shadow-sm'
                                : status === 'A'
                                ? 'bg-red-500 text-white shadow-sm'
                                : locStatus === 'allowed' 
                                  ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                  : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                            }`}
                          >
                            {status === 'P' ? 'Present' : status === 'A' ? 'Absent' : 'Mark'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
