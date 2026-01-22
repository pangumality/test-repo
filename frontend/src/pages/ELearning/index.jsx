import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Radio, Clock, FileText, Play, Pause, Square } from 'lucide-react';
import api from '../../utils/api';

const pad2 = (n) => String(n).padStart(2, '0');

const toYmd = (d) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
};

const toDateTimeLocalValue = (dateLike) => {
  const dt = new Date(dateLike);
  if (Number.isNaN(dt.getTime())) return '';
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}T${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`;
};

const getProgramEnd = (program) => {
  const start = new Date(program.scheduledFor);
  const durationSeconds = Number(program.durationSeconds) || 300;
  return new Date(start.getTime() + durationSeconds * 1000);
};

const withComputedOffset = (program, now) => {
  if (!program) return program;
  const durationSeconds = Number(program.durationSeconds) || 300;
  const startMs = new Date(program.scheduledFor).getTime();
  const offset = Number.isFinite(startMs) ? (now.getTime() - startMs) / 1000 : 0;
  const currentOffset = Math.max(0, Math.min(durationSeconds, offset));
  return { ...program, currentOffset };
};

const formatTimeRange = (program) => {
  const start = new Date(program.scheduledFor);
  const end = getProgramEnd(program);
  const fmt = (dt) => `${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`;
  return `${fmt(start)} - ${fmt(end)}`;
};

const sortPrograms = (programs) =>
  [...programs].sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());

const WORDS_PER_SECOND = 2.5;
const TTS_WORDS_PER_CHUNK = 80;
const AUDIO_EXT_RE = /\.(mp3|wav|ogg|m4a)(\?|#|$)/i;

const inferFileType = (program) => {
  if (!program) return '';
  if (program.fileType) return program.fileType;
  if (program.fileUrl && AUDIO_EXT_RE.test(program.fileUrl)) return 'AUDIO';
  if (program.fileUrl) return 'FILE';
  if (program.content) return 'TEXT';
  return 'TEXT';
};

export default function ELearning() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => new Date());
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentProgram, setCurrentProgram] = useState(null);
  const [livePrograms, setLivePrograms] = useState([]);
  const [selectedLiveProgramId, setSelectedLiveProgramId] = useState('');
  const [programs, setPrograms] = useState([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [savingProgram, setSavingProgram] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => toYmd(new Date()));
  const [form, setForm] = useState({
    title: '',
    description: '',
    scheduledFor: toDateTimeLocalValue(new Date()),
    durationSeconds: 300,
    content: '',
    file: null,
  });
  const [error, setError] = useState('');
  const [radioPlaybackError, setRadioPlaybackError] = useState('');
  const utteranceRef = useRef(null);
  const stoppedManuallyRef = useRef(false);
  const audioRef = useRef(null);
  const playbackProgramIdRef = useRef(null);
  const ttsStateRef = useRef({ words: [], index: 0, programId: null });
  const selectedLiveProgramIdRef = useRef('');

  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [isRadioDeptStaff, setIsRadioDeptStaff] = useState(false);

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
    const fetchDepartments = async () => {
      try {
        const { data } = await api.get('/me/departments');
        setIsRadioDeptStaff(Array.isArray(data) && data.includes('radio'));
      } catch {
        setIsRadioDeptStaff(false);
      }
    };
    fetchDepartments();
  }, []);

  useEffect(() => {
    const fetchPrograms = async () => {
      setLoadingPrograms(true);
      setError('');
      try {
        const { data } = await api.get('/radio/programs', { params: { date: selectedDate } });
        setPrograms(Array.isArray(data) ? data : []);
      } catch (e) {
        setError('Failed to load radio programs');
      } finally {
        setLoadingPrograms(false);
      }
    };
    fetchPrograms();
  }, [selectedDate]);

  useEffect(() => {
    const fetchLive = async () => {
      try {
        const { data } = await api.get('/radio/live');
        const live = Array.isArray(data) ? data : [];
        if (live.length > 0) {
          const preferredId = selectedLiveProgramIdRef.current;
          const nextId =
            preferredId && live.some((p) => p.id === preferredId)
              ? preferredId
              : live[0].id;

          setLivePrograms(live);
          setSelectedLiveProgramId(nextId);
          setCurrentProgram(live.find((p) => p.id === nextId) || null);
          return;
        }
      } catch {
        // ignore
      }

      setLivePrograms([]);
      setSelectedLiveProgramId('');
      try {
        const { data } = await api.get('/radio/current');
        setCurrentProgram(data || null);
      } catch {
        setCurrentProgram(null);
      }
    };

    fetchLive();
    const id = setInterval(fetchLive, 15000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    selectedLiveProgramIdRef.current = selectedLiveProgramId;
  }, [selectedLiveProgramId]);

  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date());
    }, 15000);
    return () => clearInterval(id);
  }, []);

  const hasSchedule = programs.length > 0;
  const fullSchedule = sortPrograms(programs);

  const ttsAvailable =
    typeof window !== 'undefined' &&
    window.speechSynthesis &&
    typeof window.SpeechSynthesisUtterance !== 'undefined';

  const stopTts = () => {
    if (!ttsAvailable) return;
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    ttsStateRef.current = { words: [], index: 0, programId: null };
  };

  const stopAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
  };

  const stopRadio = () => {
    stoppedManuallyRef.current = true;
    stopTts();
    stopAudio();
    playbackProgramIdRef.current = null;
    setIsPlaying(false);
    setIsPaused(false);
  };

  const selectLiveProgram = (programId) => {
    setSelectedLiveProgramId(programId);
    const picked = livePrograms.find((p) => p.id === programId) || null;
    setCurrentProgram(picked);
    setRadioPlaybackError('');
  };

  const speakNextChunk = () => {
    const state = ttsStateRef.current;
    if (stoppedManuallyRef.current) return;
    if (!state.programId || state.index >= state.words.length) {
      utteranceRef.current = null;
      setIsPlaying(false);
      setIsPaused(false);
      playbackProgramIdRef.current = null;
      return;
    }

    const chunk = state.words.slice(state.index, state.index + TTS_WORDS_PER_CHUNK).join(' ');
    if (!chunk.trim()) {
      state.index = state.words.length;
      speakNextChunk();
      return;
    }

    const utter = new SpeechSynthesisUtterance(chunk);
    utter.onstart = () => {
      setRadioPlaybackError('');
    };
    utter.onend = () => {
      utteranceRef.current = null;
      state.index += TTS_WORDS_PER_CHUNK;
      if (!stoppedManuallyRef.current) {
        speakNextChunk();
      }
    };
    utter.onerror = () => {
      utteranceRef.current = null;
      setIsPlaying(false);
      setIsPaused(false);
      playbackProgramIdRef.current = null;
      setRadioPlaybackError('Text-to-speech failed to play.');
    };

    utteranceRef.current = utter;
    try {
      window.speechSynthesis.resume();
    } catch {
      // ignore
    }
    setTimeout(() => {
      if (!stoppedManuallyRef.current) {
        try {
          window.speechSynthesis.speak(utter);
        } catch {
          utteranceRef.current = null;
          setIsPlaying(false);
          setIsPaused(false);
          playbackProgramIdRef.current = null;
          setRadioPlaybackError('Text-to-speech failed to start.');
        }
      }
    }, 50);
  };

  const startTts = (program) => {
    if (!ttsAvailable || !program) return;
    const text = `${program.title || ''}. ${program.content || ''}`.trim();
    if (!text) return;

    stoppedManuallyRef.current = false;
    stopAudio();
    stopTts();

    const words = text.split(/\s+/).filter(Boolean);
    const offsetSeconds = Number(program.currentOffset) || 0;
    const estimatedSeconds = words.length > 0 ? words.length / WORDS_PER_SECOND : 0;
    const startIndex =
      estimatedSeconds > 0 && offsetSeconds > estimatedSeconds
        ? 0
        : Math.max(0, Math.floor(offsetSeconds * WORDS_PER_SECOND));

    playbackProgramIdRef.current = program.id;
    ttsStateRef.current = { words, index: startIndex, programId: program.id };

    setIsPlaying(true);
    setIsPaused(false);
    speakNextChunk();
  };

  const startAudio = async (program) => {
    if (!program?.fileUrl) return;
    const audio = audioRef.current;
    if (!audio) return;

    stoppedManuallyRef.current = false;
    stopTts();

    playbackProgramIdRef.current = program.id;
    audio.src = program.fileUrl;

    const offsetSeconds = Math.max(0, Number(program.currentOffset) || 0);

    const seekAndPlay = async () => {
      try {
        if (Number.isFinite(audio.duration) && audio.duration > 0) {
          audio.currentTime = Math.min(offsetSeconds, Math.max(0, audio.duration - 0.5));
        } else {
          audio.currentTime = offsetSeconds;
        }
      } catch {
        audio.currentTime = 0;
      }

      try {
        await audio.play();
        setIsPlaying(true);
        setIsPaused(false);
        setRadioPlaybackError('');
      } catch {
        setIsPlaying(false);
        setIsPaused(false);
        setRadioPlaybackError('Audio playback was blocked by the browser.');
      }
    };

    if (audio.readyState >= 1) {
      await seekAndPlay();
      return;
    }

    const onLoaded = async () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      await seekAndPlay();
    };
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.load();
  };

  const startRadio = async () => {
    setRadioPlaybackError('');

    let program = currentProgram;
    try {
      const { data } = await api.get('/radio/live');
      const live = Array.isArray(data) ? data : [];
      if (live.length > 0) {
        const preferredId = selectedLiveProgramIdRef.current;
        const nextId =
          preferredId && live.some((p) => p.id === preferredId)
            ? preferredId
            : live[0].id;

        setLivePrograms(live);
        setSelectedLiveProgramId(nextId);
        program = live.find((p) => p.id === nextId) || live[0];
        setCurrentProgram(program);
      } else {
        setLivePrograms([]);
        setSelectedLiveProgramId('');
        const res = await api.get('/radio/current');
        if (res.data) {
          program = res.data;
          setCurrentProgram(res.data);
        }
      }
    } catch {
      // ignore
    }

    if (!program) {
      setRadioPlaybackError('No live program is scheduled right now.');
      return;
    }

    const programWithOffset =
      program.currentOffset !== undefined && program.currentOffset !== null
        ? program
        : withComputedOffset(program, new Date());

    const effectiveType = inferFileType(programWithOffset);
    if (effectiveType === 'AUDIO') {
      await startAudio(programWithOffset);
      return;
    }
    if (!ttsAvailable) {
      setRadioPlaybackError('Text-to-speech is not supported in this browser.');
      return;
    }
    if (!String(programWithOffset.title || '').trim() && !String(programWithOffset.content || '').trim()) {
      setRadioPlaybackError('This program has no readable text.');
      return;
    }
    startTts(programWithOffset);
  };

  const pauseRadio = () => {
    if (playbackProgramIdRef.current && audioRef.current?.src) {
      audioRef.current.pause();
      setIsPaused(true);
      return;
    }
    if (!ttsAvailable) return;
    window.speechSynthesis.pause();
    setIsPaused(true);
  };

  const resumeRadio = () => {
    if (playbackProgramIdRef.current && audioRef.current?.src) {
      audioRef.current.play();
      setIsPaused(false);
      return;
    }
    if (!ttsAvailable) return;
    window.speechSynthesis.resume();
    setIsPaused(false);
  };

  useEffect(() => {
    if (!isPlaying) return;
    const playingId = playbackProgramIdRef.current;
    if (!playingId) return;
    if (!currentProgram) {
      stopRadio();
      return;
    }
    if (currentProgram.id !== playingId) {
      if (currentProgram.fileType === 'AUDIO') {
        startAudio(currentProgram);
      } else if (ttsAvailable) {
        startTts(currentProgram);
      } else {
        stopRadio();
      }
    }
  }, [currentProgram, isPlaying, ttsAvailable]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onEnded = () => {
      playbackProgramIdRef.current = null;
      setIsPlaying(false);
      setIsPaused(false);
    };
    const onError = () => {
      playbackProgramIdRef.current = null;
      setIsPlaying(false);
      setIsPaused(false);
      setRadioPlaybackError('Audio failed to load or play.');
    };

    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      stopRadio();
    };
  }, []);

  const isRadioManager =
    currentUserRole === 'school_admin' ||
    currentUserRole === 'admin' ||
    isRadioDeptStaff;

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      scheduledFor: toDateTimeLocalValue(new Date()),
      durationSeconds: 300,
      content: '',
      file: null,
    });
    setEditingProgram(null);
  };

  const handleEditProgram = (program) => {
    setEditingProgram(program);
    setForm({
      title: program.title || '',
      description: program.description || '',
      scheduledFor: toDateTimeLocalValue(program.scheduledFor),
      durationSeconds: program.durationSeconds ?? 300,
      content: program.content || '',
      file: null,
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
      const fd = new FormData();
      fd.append('title', form.title);
      if (form.description) fd.append('description', form.description);
      fd.append('scheduledFor', form.scheduledFor);
      fd.append('durationSeconds', String(form.durationSeconds));
      if (form.content) fd.append('content', form.content);
      if (form.file) fd.append('file', form.file);

      if (editingProgram) {
        const { data } = await api.put(`/radio/programs/${editingProgram.id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setPrograms((prev) => prev.map((p) => (p.id === data.id ? data : p)));
      } else {
        const { data } = await api.post('/radio/programs', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setPrograms((prev) => sortPrograms([...prev, data]));
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
                Tune in to listen to scheduled PDF readings (TTS) and audio uploads.
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
            {livePrograms.length > 1 && (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-semibold text-slate-700 mb-2">Choose a live program</div>
                <div className="space-y-2">
                  {livePrograms.map((program) => (
                    <label
                      key={program.id}
                      className="flex items-start gap-2 rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="liveProgram"
                        value={program.id}
                        checked={(selectedLiveProgramId || currentProgram?.id) === program.id}
                        onChange={() => selectLiveProgram(program.id)}
                        className="mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-xs font-semibold text-slate-800 truncate">{program.title}</div>
                          <div className="text-[10px] text-slate-500 shrink-0">{formatTimeRange(program)}</div>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500">
                          <FileText size={11} />
                          <span>{program.fileType || inferFileType(program) || 'PROGRAM'}</span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
            {currentProgram && (
              <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-orange-500 text-white">
                      LIVE
                    </span>
                    <span className="text-xs font-medium text-slate-700">
                      {formatTimeRange(currentProgram)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-600">
                    <FileText size={12} />
                    <span>{currentProgram.fileType || 'PROGRAM'}</span>
                  </div>
                </div>
                <h4 className="font-semibold text-slate-800 mb-1">{currentProgram.title}</h4>
                <p className="text-xs text-slate-600 mb-3">{currentProgram.description}</p>
                {radioPlaybackError && (
                  <div className="mb-2 text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {radioPlaybackError}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {currentProgram.fileType !== 'AUDIO' && !ttsAvailable && (
                    <span className="text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-full px-3 py-1">
                      Text-to-speech is not supported in this browser.
                    </span>
                  )}
                  {((inferFileType(currentProgram) === 'AUDIO') || ttsAvailable) && !isPlaying && (
                    <button
                      type="button"
                      onClick={startRadio}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full bg-orange-500 text-white hover:bg-orange-600"
                    >
                      <Play size={14} />
                      Play now
                    </button>
                  )}
                  {isPlaying && !isPaused && (
                    <button
                      type="button"
                      onClick={pauseRadio}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full bg-slate-700 text-white hover:bg-slate-800"
                    >
                      <Pause size={14} />
                      Pause
                    </button>
                  )}
                  {isPlaying && isPaused && (
                    <button
                      type="button"
                      onClick={resumeRadio}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      <Play size={14} />
                      Resume
                    </button>
                  )}
                  {isPlaying && (
                    <button
                      type="button"
                      onClick={stopRadio}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full bg-slate-200 text-slate-800 hover:bg-slate-300"
                    >
                      <Square size={14} />
                      Stop
                    </button>
                  )}
                  {currentProgram.fileUrl && (
                    <a
                      href={currentProgram.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                    >
                      <FileText size={14} />
                      Open file
                    </a>
                  )}
                </div>
              </div>
            )}
            {!currentProgram && (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
                No radio program is scheduled for the current time.
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Daily program schedule
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full md:w-auto border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {loadingPrograms && (
                <span className="text-xs text-slate-500">Loading…</span>
              )}
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
                      {formatTimeRange(show)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-1 text-[10px] text-slate-500">
                    <div className="flex items-center gap-1">
                      <FileText size={11} />
                      <span>{show.fileType || 'PROGRAM'}</span>
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
                <label className="text-xs font-medium text-slate-600">Scheduled date & time</label>
                <input
                  type="datetime-local"
                  value={form.scheduledFor}
                  onChange={(e) => setForm({ ...form, scheduledFor: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Duration (seconds)</label>
                <input
                  type="number"
                  min="1"
                  value={form.durationSeconds}
                  onChange={(e) => setForm({ ...form, durationSeconds: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">PDF/audio upload (optional)</label>
              <input
                type="file"
                accept=".pdf,audio/*"
                onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Text content (optional, used for TTS)</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
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

      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
