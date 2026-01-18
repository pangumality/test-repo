import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Radio, Clock, FileText, Play, Pause, Square } from 'lucide-react';
import api from '../../utils/api';

const getMinuteOfDay = (date) => date.getHours() * 60 + date.getMinutes();

const findCurrentShow = (date, schedule) => {
  const minute = getMinuteOfDay(date);
  const sorted = [...schedule].sort((a, b) => a.startMinute - b.startMinute);
  if (sorted.length === 0) return null;

  let current = null;
  for (const show of sorted) {
    if (show.startMinute <= minute) {
      current = show;
    }
  }

  if (current) return current;
  return sorted[sorted.length - 1];
};

const getSortedSchedule = (schedule) =>
  [...schedule].sort((a, b) => a.startMinute - b.startMinute);

const getNextShow = (current, schedule) => {
  const sorted = getSortedSchedule(schedule);
  if (sorted.length === 0 || !current) return null;
  const index = sorted.findIndex((s) => s.id === current.id);
  if (index === -1) return sorted[0] || null;
  const nextIndex = (index + 1) % sorted.length;
  return sorted[nextIndex];
};

const formatMinutesRange = (startMinute, durationMinutes) => {
  const pad = (n) => String(n).padStart(2, '0');
  const startHour = Math.floor(startMinute / 60);
  const startMin = startMinute % 60;
  const endTotal = startMinute + durationMinutes;
  const endHour = Math.floor((endTotal % (24 * 60)) / 60);
  const endMin = endTotal % 60;
  return `${pad(startHour)}:${pad(startMin)} - ${pad(endHour)}:${pad(endMin)}`;
};

export default function ELearning() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => new Date());
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentProgramId, setCurrentProgramId] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [savingProgram, setSavingProgram] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    text: '',
    startMinute: 0,
    durationMinutes: 60,
  });
  const [error, setError] = useState('');
  const utteranceRef = useRef(null);
  const stoppedManuallyRef = useRef(false);

  const [currentUserRole, setCurrentUserRole] = useState(null);

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

  useEffect(() => {
    const loadRole = () => {
      try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        setCurrentUserRole(currentUser?.role || null);
      } catch {
        setCurrentUserRole(null);
      }
    };
    loadRole();
  }, []);

  useEffect(() => {
    const fetchPrograms = async () => {
      setLoadingPrograms(true);
      setError('');
      try {
        const { data } = await api.get('/radio/programs');
        setPrograms(Array.isArray(data) ? data : []);
      } catch (e) {
        setError('Failed to load radio programs');
      } finally {
        setLoadingPrograms(false);
      }
    };
    fetchPrograms();
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date());
    }, 30000);
    return () => clearInterval(id);
  }, []);

  const hasSchedule = programs.length > 0;
  const currentShow = hasSchedule ? findCurrentShow(now, programs) : null;
  const fullSchedule = getSortedSchedule(programs);

  const activeShow =
    currentProgramId && hasSchedule
      ? programs.find((s) => s.id === currentProgramId) || currentShow
      : currentShow;

  const ttsAvailable =
    typeof window !== 'undefined' &&
    window.speechSynthesis &&
    typeof window.SpeechSynthesisUtterance !== 'undefined';

  const playShow = (show) => {
    if (!ttsAvailable || !show) return;
    stoppedManuallyRef.current = false;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(
      `${show.title}. ${show.text || ''}`
    );
    utter.onend = () => {
      utteranceRef.current = null;
      if (stoppedManuallyRef.current) {
        stoppedManuallyRef.current = false;
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentProgramId(null);
        return;
      }
      const nextShow = getNextShow(show, programs);
      if (nextShow) {
        setCurrentProgramId(nextShow.id);
        playShow(nextShow);
      } else {
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentProgramId(null);
      }
    };
    utteranceRef.current = utter;
    setCurrentProgramId(show.id);
    window.speechSynthesis.speak(utter);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const startRadio = () => {
    if (!ttsAvailable) return;
    const baseShow = activeShow || currentShow;
    if (!baseShow) return;
    playShow(baseShow);
  };

  const pauseRadio = () => {
    if (!ttsAvailable) return;
    window.speechSynthesis.pause();
    setIsPaused(true);
  };

  const resumeRadio = () => {
    if (!ttsAvailable) return;
    window.speechSynthesis.resume();
    setIsPaused(false);
  };

  const stopRadio = () => {
    if (!ttsAvailable) return;
    stoppedManuallyRef.current = true;
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentProgramId(null);
  };

  const isRadioManager =
    currentUserRole === 'school_admin' ||
    currentUserRole === 'admin';

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      text: '',
      startMinute: 0,
      durationMinutes: 60,
    });
    setEditingProgram(null);
  };

  const handleEditProgram = (program) => {
    setEditingProgram(program);
    setForm({
      title: program.title || '',
      description: program.description || '',
      text: program.text || '',
      startMinute: program.startMinute ?? 0,
      durationMinutes: program.durationMinutes ?? 60,
    });
  };

  const handleDeleteProgram = async (program) => {
    if (!window.confirm('Delete this radio program?')) return;
    try {
      await api.delete(`/radio/programs/${program.id}`);
      setPrograms((prev) => prev.filter((p) => p.id !== program.id));
    } catch (e) {
      setError('Failed to delete radio program');
    }
  };

  const handleSubmitProgram = async (e) => {
    e.preventDefault();
    setSavingProgram(true);
    setError('');
    try {
      const payload = {
        ...form,
        startMinute: Number(form.startMinute),
        durationMinutes: Number(form.durationMinutes),
      };
      if (editingProgram) {
        const { data } = await api.put(`/radio/programs/${editingProgram.id}`, payload);
        setPrograms((prev) => prev.map((p) => (p.id === data.id ? data : p)));
      } else {
        const { data } = await api.post('/radio/programs', payload);
        setPrograms((prev) => [...prev, data]);
      }
      resetForm();
    } catch (e) {
      setError('Failed to save radio program');
    } finally {
      setSavingProgram(false);
    }
  };

  if (loading && loadingPrograms) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 animate-spin"
             style={{ borderTopColor: 'var(--ui-accent)' }} />
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

      <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-soft p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md"
                 style={{ backgroundImage: 'linear-gradient(to bottom right, #f97316, #ea580c)' }}>
              <Radio size={22} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800">24/7 E-Learning Radio</h3>
              <p className="text-xs text-slate-500">
                Tune in any time to listen to scheduled readings from sample Word documents.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock size={14} />
            <span>
              Current time:{' '}
              {now.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-3">
            {hasSchedule && activeShow && (
              <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-orange-500 text-white">
                      LIVE
                    </span>
                    <span className="text-xs font-medium text-slate-700">
                      {formatMinutesRange(activeShow.startMinute, activeShow.durationMinutes)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-600">
                    <FileText size={12} />
                    <span>{activeShow.fileName}</span>
                  </div>
                </div>
                <h4 className="font-semibold text-slate-800 mb-1">{activeShow.title}</h4>
                <p className="text-xs text-slate-600 mb-3">{activeShow.description}</p>
                <div className="flex flex-wrap gap-2">
                  {!ttsAvailable && (
                    <span className="text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-full px-3 py-1">
                      Text-to-speech is not supported in this browser.
                    </span>
                  )}
                  {ttsAvailable && !isPlaying && (
                    <button
                      type="button"
                      onClick={startRadio}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full bg-orange-500 text-white hover:bg-orange-600"
                    >
                      <Play size={14} />
                      Play now
                    </button>
                  )}
                  {ttsAvailable && isPlaying && !isPaused && (
                    <button
                      type="button"
                      onClick={pauseRadio}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full bg-slate-700 text-white hover:bg-slate-800"
                    >
                      <Pause size={14} />
                      Pause
                    </button>
                  )}
                  {ttsAvailable && isPlaying && isPaused && (
                    <button
                      type="button"
                      onClick={resumeRadio}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      <Play size={14} />
                      Resume
                    </button>
                  )}
                  {ttsAvailable && isPlaying && (
                    <button
                      type="button"
                      onClick={stopRadio}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full bg-slate-200 text-slate-800 hover:bg-slate-300"
                    >
                      <Square size={14} />
                      Stop
                    </button>
                  )}
                </div>
              </div>
            )}
            {!hasSchedule && (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
                No radio programs are configured yet.
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Daily program schedule
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {fullSchedule.map((show) => (
                <div
                  key={show.id}
                  className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 text-xs text-slate-700"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold">{show.title}</span>
                    <span className="text-[10px] text-slate-500">
                      {formatMinutesRange(show.startMinute, show.durationMinutes)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-1 text-[10px] text-slate-500">
                    <div className="flex items-center gap-1">
                      <FileText size={11} />
                      <span>{show.description}</span>
                    </div>
                    {isRadioManager && (
                      <button
                        type="button"
                        onClick={() => handleEditProgram(show)}
                        className="text-[10px] text-indigo-600 hover:underline"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isRadioManager && (
        <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-soft p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800">
              Manage Radio Programs
            </h3>
            {editingProgram && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                New program
              </button>
            )}
          </div>
          {error && (
            <div className="mb-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmitProgram} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Short Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Start time (minutes from midnight)</label>
                <input
                  type="number"
                  min="0"
                  max={24 * 60 - 1}
                  value={form.startMinute}
                  onChange={(e) => setForm({ ...form, startMinute: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Duration (minutes)</label>
                <input
                  type="number"
                  min="1"
                  value={form.durationMinutes}
                  onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Content to be read (text)</label>
              <textarea
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                rows={4}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center justify-between">
              {editingProgram && (
                <button
                  type="button"
                  onClick={() => handleDeleteProgram(editingProgram)}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  Delete this program
                </button>
              )}
              <button
                type="submit"
                disabled={savingProgram}
                className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 disabled:opacity-60"
              >
                {savingProgram ? 'Saving...' : editingProgram ? 'Update program' : 'Add program'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-soft p-6">
        {subjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 mb-4"
                 style={{ backgroundImage: 'linear-gradient(to bottom right, var(--ui-accent-strong), var(--ui-accent))' }}>
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
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform"
                       style={{ backgroundImage: 'linear-gradient(to bottom right, var(--ui-accent-strong), var(--ui-accent-secondary))' }}>
                    <span className="text-sm font-semibold">
                      {s.name?.[0]?.toUpperCase() || 'S'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-700 group-hover:text-slate-900">
                      {s.name}
                    </span>
                    <span className="text-xs text-slate-400">
                      Subject {index + 1}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full border transition-colors"
                      style={{ backgroundColor: 'var(--ui-accent-soft)', color: 'var(--ui-accent)' }}>
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
