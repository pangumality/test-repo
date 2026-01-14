import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, FileText, Edit2, Volume2, Play, Pause, StopCircle, Calendar, Image as ImageIcon, BookOpen, Clock, Briefcase, List, Bot } from 'lucide-react';
import api from '../../utils/api';
import AITutor from './components/AITutor';

const TabButton = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
      active 
        ? 'bg-indigo-600 text-white' 
        : 'bg-white text-gray-600 hover:bg-gray-50'
    }`}
  >
    <Icon size={18} />
    <span className="whitespace-nowrap">{label}</span>
  </button>
);

const GenericCrud = ({ 
  endpoint, 
  subjectId, 
  canManage, 
  fields, 
  title, 
  icon: Icon, 
  classes,
  renderItem,
  onAdd,
  onEdit
}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchItems();
  }, [endpoint, subjectId]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`Fetching ${endpoint} for subjectId: ${subjectId}`);
      const { data } = await api.get(`/${endpoint}?subjectId=${subjectId}`);
      console.log(`Fetched ${data.length} items for ${endpoint}`);
      setItems(data);
    } catch (error) {
      console.error(`Failed to fetch ${endpoint}:`, error);
      setError('Failed to load items. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/${endpoint}/${editingItem.id}`, { ...formData, subjectId });
      } else {
        await api.post(`/${endpoint}`, { ...formData, subjectId });
      }
      setShowModal(false);
      setEditingItem(null);
      setFormData({});
      fetchItems();
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save item');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await api.delete(`/${endpoint}/${id}`);
      fetchItems();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleAdd = () => {
    if (onAdd) {
      onAdd();
    } else {
      setEditingItem(null);
      setFormData({});
      setShowModal(true);
    }
  };

  const handleEdit = (item) => {
    if (onEdit) {
      onEdit(item);
    } else {
      setEditingItem(item);
      setFormData(item);
      setShowModal(true);
    }
  };

  if (loading) return <div className="p-4 text-center text-gray-500">Loading {title}...</div>;
  if (error) return <div className="p-4 text-center text-red-500">{error} <button onClick={fetchItems} className="underline ml-2">Retry</button></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
           <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
           <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{items.length}</span>
        </div>
        {canManage && (
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus size={18} />
            Add {title}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.length === 0 ? (
          <p className="text-gray-500 col-span-full">No items found.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 relative group">
              {renderItem(item)}
              {canManage && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(item)} className="p-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-1 bg-red-50 text-red-600 rounded hover:bg-red-100">
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingItem ? `Edit ${title}` : `Add ${title}`}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {fields.map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                  {field.type === 'textarea' ? (
                    <textarea
                      value={formData[field.name] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg h-24"
                      required={field.required}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      value={formData[field.name] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      required={field.required}
                    >
                      <option value="">Select...</option>
                      {field.options ? field.options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      )) : classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type || 'text'}
                      value={formData[field.name] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      required={field.required}
                    />
                  )}
                </div>
              ))}
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default function Subject() {
  const { subjectId } = useParams();
  const [activeTab, setActiveTab] = useState('notes');
  const [subjectName, setSubjectName] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [canManage, setCanManage] = useState(false);
  const [classes, setClasses] = useState([]);
  
  // Notes state
  const [notes, setNotes] = useState([]);
  const [speakingId, setSpeakingId] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [query, setQuery] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [newNote, setNewNote] = useState({ title: '', content: '' });

  // Exams state
  const [exams, setExams] = useState([]);
  const [showExamModal, setShowExamModal] = useState(false);
  const [newExam, setNewExam] = useState({ name: '', term: '', year: new Date().getFullYear() });
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    setCurrentUser(user);
    fetchData(user);
    fetchClasses();
  }, [subjectId]);

  const fetchData = async (user) => {
    try {
      const { data: subjects } = await api.get('/subjects');
      const subject = subjects.find(s => s.id === subjectId);
      if (subject) setSubjectName(subject.name);
      
      const isTeacher = user?.role === 'teacher';
      const isAdmin = user?.role === 'admin' || user?.role === 'school_admin';
      setCanManage(isAdmin || isTeacher);

      const { data: notesData } = await api.get(`/class-notes?subjectId=${subjectId}`);
      setNotes(notesData);
      
      const { data: examsData } = await api.get('/exams');
      setExams(examsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const fetchClasses = async () => {
    try {
      const { data } = await api.get('/classes');
      setClasses(data);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    }
  };

  // Note Handlers
  const handleNoteSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingNoteId) {
        await api.put(`/class-notes/${editingNoteId}`, { ...newNote, subjectId });
      } else {
        await api.post('/class-notes', { ...newNote, subjectId });
      }
      setNewNote({ title: '', content: '' });
      setEditingNoteId(null);
      setShowNoteModal(false);
      const { data } = await api.get(`/class-notes?subjectId=${subjectId}`);
      setNotes(data);
    } catch (error) {
      alert('Failed to save note');
    }
  };

  const handleNoteDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await api.delete(`/class-notes/${id}`);
      const { data } = await api.get(`/class-notes?subjectId=${subjectId}`);
      setNotes(data);
    } catch (error) {
      console.error(error);
    }
  };

  // Exam Handlers
  const handleCreateExam = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/exams', newExam);
      const created = res.data;
      setShowExamModal(false);
      setNewExam({ name: '', term: '', year: new Date().getFullYear() });
      navigate(`/exams/${created.id}/setup?subjectId=${subjectId}`);
    } catch (error) {
      alert('Failed to create exam');
    }
  };

  // Speech Handlers (Simplified)
  const speakNote = (note) => {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(`${note.title}. ${note.content}`);
    utter.onend = () => { setSpeakingId(null); setIsPaused(false); };
    window.speechSynthesis.speak(utter);
    setSpeakingId(note.id);
    setIsPaused(false);
  };
  const pauseSpeak = () => { window.speechSynthesis.pause(); setIsPaused(true); };
  const resumeSpeak = () => { window.speechSynthesis.resume(); setIsPaused(false); };
  const stopSpeak = () => { window.speechSynthesis.cancel(); setSpeakingId(null); setIsPaused(false); };

  const filteredNotes = notes.filter(n => 
    (n.title?.toLowerCase() || '').includes(query.toLowerCase()) || 
    (n.content?.toLowerCase() || '').includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/e-learning" className="p-2 bg-white/10 hover:bg-white/20 rounded-full">
            <ArrowLeft size={20} className="text-white" />
          </Link>
          <div>
            <div className="text-xs opacity-80">E-Learning</div>
            <h2 className="text-2xl font-semibold tracking-wide">{subjectName || 'Subject'}</h2>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          <TabButton active={activeTab === 'notes'} onClick={() => setActiveTab('notes')} icon={FileText} label="Notes" />
          <TabButton active={activeTab === 'class-work'} onClick={() => setActiveTab('class-work')} icon={Briefcase} label="Class Work" />
          <TabButton active={activeTab === 'homework'} onClick={() => setActiveTab('homework')} icon={BookOpen} label="Homework" />
          <TabButton active={activeTab === 'syllabus'} onClick={() => setActiveTab('syllabus')} icon={FileText} label="Syllabus" />
          <TabButton active={activeTab === 'exams'} onClick={() => setActiveTab('exams')} icon={Edit2} label="Exams" />
          <TabButton active={activeTab === 'ai-tutor'} onClick={() => setActiveTab('ai-tutor')} icon={Bot} label="AI Tutor" />
        </div>
      </div>

      {/* Content */}
      <div className="mt-6">
        {activeTab === 'ai-tutor' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
               <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Bot size={24}/></div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">AI Subject Expert</h3>
                    <p className="text-sm text-gray-500">Ask any questions about {subjectName}</p>
                  </div>
               </div>
               <AITutor embedded={true} context={subjectName} />
            </div>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-4">
             <div className="flex justify-between items-center">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search notes..."
                  className="px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full max-w-md"
                />
                {canManage && (
                  <button onClick={() => { setEditingNoteId(null); setNewNote({title:'', content:''}); setShowNoteModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                    <Plus size={18} /> Add Note
                  </button>
                )}
             </div>

             {speakingId && (
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                   <div className="text-sm text-gray-700 flex items-center gap-2"><Volume2 size={16}/> Playing...</div>
                   <div className="flex gap-2">
                     {!isPaused ? <button onClick={pauseSpeak}><Pause size={18}/></button> : <button onClick={resumeSpeak}><Play size={18}/></button>}
                     <button onClick={stopSpeak} className="text-red-500"><StopCircle size={18}/></button>
                   </div>
                </div>
             )}

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {filteredNotes.map(note => (
                 <div key={note.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 relative group">
                   <div className="flex justify-between items-start mb-2">
                     <h3 className="font-semibold text-gray-800">{note.title}</h3>
                     <button onClick={() => speakNote(note)} className="text-indigo-600 hover:text-indigo-800"><Volume2 size={18}/></button>
                   </div>
                   <p className="text-gray-600 text-sm line-clamp-3 whitespace-pre-wrap">{note.content}</p>
                   {canManage && (
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white p-1 rounded shadow-sm">
                        <button onClick={() => { setEditingNoteId(note.id); setNewNote({title: note.title, content: note.content}); setShowNoteModal(true); }} className="p-1 text-blue-600"><Edit2 size={14}/></button>
                        <button onClick={() => handleNoteDelete(note.id)} className="p-1 text-red-600"><Trash2 size={14}/></button>
                      </div>
                   )}
                 </div>
               ))}
             </div>
             
             {showNoteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
                    <h2 className="text-xl font-bold mb-4">{editingNoteId ? 'Edit Note' : 'Add Note'}</h2>
                    <form onSubmit={handleNoteSubmit}>
                      <input className="w-full mb-4 px-3 py-2 border rounded-lg" placeholder="Title" value={newNote.title} onChange={e => setNewNote({...newNote, title: e.target.value})} required />
                      <textarea className="w-full mb-4 px-3 py-2 border rounded-lg h-32" placeholder="Content" value={newNote.content} onChange={e => setNewNote({...newNote, content: e.target.value})} required />
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setShowNoteModal(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Save</button>
                      </div>
                    </form>
                  </div>
                </div>
             )}
          </div>
        )}

        {activeTab === 'class-work' && (
          <GenericCrud
            endpoint="class-work"
            subjectId={subjectId}
            canManage={canManage}
            title="Class Work"
            icon={Briefcase}
            classes={classes}
            onAdd={() => navigate(`/e-learning/${subjectId}/class-work/form`)}
            onEdit={(item) => navigate(`/e-learning/${subjectId}/class-work/form?id=${item.id}`)}
            fields={[
              { name: 'title', label: 'Title', required: true },
              { name: 'description', label: 'Description', type: 'textarea' },
              { name: 'date', label: 'Date', type: 'date', required: true },
              { name: 'classId', label: 'Class (Optional)', type: 'select' }
            ]}
            renderItem={(item) => (
              <div>
                <h4 className="font-semibold text-gray-800">{item.title}</h4>
                <div className="text-xs text-gray-500 mb-2">{new Date(item.date).toLocaleDateString()}</div>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{item.description}</p>
                {item.questions && Array.isArray(item.questions) && item.questions.length > 0 && (
                   <div className="mt-3 pt-2 border-t border-gray-100">
                     <p className="text-xs font-semibold text-gray-500 mb-2">Questions:</p>
                     <ul className="list-decimal list-inside space-y-1">
                       {item.questions.map((q, i) => (
                         <li key={i} className="text-sm text-gray-600 pl-1">{q}</li>
                       ))}
                     </ul>
                   </div>
                )}
              </div>
            )}
          />
        )}

        {activeTab === 'homework' && (
          <GenericCrud
            endpoint="homework"
            subjectId={subjectId}
            canManage={canManage}
            title="Homework"
            icon={BookOpen}
            classes={classes}
            onAdd={() => navigate(`/e-learning/${subjectId}/homework/form`)}
            onEdit={(item) => navigate(`/e-learning/${subjectId}/homework/form?id=${item.id}`)}
            fields={[
              { name: 'title', label: 'Title', required: true },
              { name: 'description', label: 'Description', type: 'textarea' },
              { name: 'dueDate', label: 'Due Date', type: 'date', required: true },
              { name: 'classId', label: 'Class (Optional)', type: 'select' }
            ]}
            renderItem={(item) => (
              <div>
                <h4 className="font-semibold text-gray-800">{item.title}</h4>
                <div className="text-xs text-red-500 mb-2">Due: {new Date(item.dueDate).toLocaleDateString()}</div>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{item.description}</p>
                {item.questions && Array.isArray(item.questions) && item.questions.length > 0 && (
                   <div className="mt-3 pt-2 border-t border-gray-100">
                     <p className="text-xs font-semibold text-gray-500 mb-2">Questions:</p>
                     <ul className="list-decimal list-inside space-y-1">
                       {item.questions.map((q, i) => (
                         <li key={i} className="text-sm text-gray-600 pl-1">{q}</li>
                       ))}
                     </ul>
                   </div>
                )}
              </div>
            )}
          />
        )}

        {activeTab === 'syllabus' && (
          <GenericCrud
            endpoint="syllabus"
            subjectId={subjectId}
            canManage={canManage}
            title="Syllabus"
            icon={FileText}
            classes={classes}
            onAdd={() => navigate(`/e-learning/${subjectId}/syllabus/form`)}
            onEdit={(item) => navigate(`/e-learning/${subjectId}/syllabus/form?id=${item.id}`)}
            fields={[
              { name: 'title', label: 'Title', required: true },
              { name: 'term', label: 'Term (e.g. First Term)' },
              { name: 'content', label: 'Topics', type: 'textarea', required: true },
              { name: 'classId', label: 'Class (Optional)', type: 'select' }
            ]}
            renderItem={(item) => (
              <div>
                <div className="flex justify-between">
                   <h4 className="font-semibold text-gray-800">{item.title}</h4>
                   <span className="text-xs bg-gray-100 px-2 py-1 rounded">{item.term}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{item.content}</p>
              </div>
            )}
          />
        )}





        {activeTab === 'exams' && (
           <div className="space-y-4">
              <div className="flex justify-between">
                <h3 className="text-lg font-semibold">Exams</h3>
                {canManage && (
                  <button onClick={() => setShowExamModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg">
                    <Plus size={18} /> Create Exam
                  </button>
                )}
              </div>
              {/* Exam list placeholder - can be expanded */}
              <div className="grid grid-cols-1 gap-4">
                 {exams.length === 0 && <p className="text-gray-500">No exams configured.</p>}
                 {exams.map(exam => (
                   <div key={exam.id} className="p-4 bg-white border rounded-lg shadow-sm flex justify-between items-center">
                      <div>
                        <div className="font-semibold">{exam.name}</div>
                        <div className="text-sm text-gray-500">{exam.term} - {exam.year}</div>
                      </div>
                      <Link to={`/exams/${exam.id}/setup?subjectId=${subjectId}`} className="text-indigo-600 hover:underline">Manage</Link>
                   </div>
                 ))}
              </div>
              
              {showExamModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-lg p-6 w-full max-w-md">
                    <h2 className="text-xl font-bold mb-4">Create Exam</h2>
                    <form onSubmit={handleCreateExam} className="space-y-4">
                      <input className="w-full px-3 py-2 border rounded-lg" placeholder="Exam Name" value={newExam.name} onChange={e => setNewExam({...newExam, name: e.target.value})} required />
                      <input className="w-full px-3 py-2 border rounded-lg" placeholder="Term" value={newExam.term} onChange={e => setNewExam({...newExam, term: e.target.value})} required />
                      <input className="w-full px-3 py-2 border rounded-lg" type="number" placeholder="Year" value={newExam.year} onChange={e => setNewExam({...newExam, year: parseInt(e.target.value)})} required />
                      <div className="flex justify-end gap-2">
                         <button type="button" onClick={() => setShowExamModal(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                         <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Create</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
           </div>
        )}

      </div>
    </div>
  );
}
