import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader, Plus, Trash2 } from 'lucide-react';
import api from '../../utils/api';

export default function ElearningItemForm() {
  const { subjectId, type } = useParams();
  const [searchParams] = useSearchParams();
  const itemId = searchParams.get('id');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState('');
  const [initialLoading, setInitialLoading] = useState(false);

  // Configuration for different item types
  const config = {
    'class-work': {
      title: 'Class Work',
      endpoint: 'class-work',
      fields: [
        { name: 'title', label: 'Title', required: true },
        { name: 'description', label: 'Description', type: 'textarea' },
        { name: 'questions', label: 'Questions', type: 'questions' },
        { name: 'date', label: 'Date', type: 'date', required: true },
        { name: 'classId', label: 'Class (Optional)', type: 'select' }
      ]
    },
    'homework': {
      title: 'Homework',
      endpoint: 'homework',
      fields: [
        { name: 'title', label: 'Title', required: true },
        { name: 'description', label: 'Description', type: 'textarea' },
        { name: 'questions', label: 'Questions', type: 'questions' },
        { name: 'dueDate', label: 'Due Date', type: 'date', required: true },
        { name: 'classId', label: 'Class (Optional)', type: 'select' }
      ]
    },
    'syllabus': {
      title: 'Syllabus',
      endpoint: 'syllabus',
      fields: [
        { name: 'title', label: 'Title', required: true },
        { name: 'term', label: 'Term (e.g. First Term)' },
        { name: 'content', label: 'Topics', type: 'textarea', required: true },
        { name: 'classId', label: 'Class (Optional)', type: 'select' }
      ]
    }
  };

  const currentConfig = config[type];

  useEffect(() => {
    const init = async () => {
      setInitialLoading(true);
      await fetchClasses();
      if (itemId && currentConfig) {
        await fetchItem();
      }
      setInitialLoading(false);
    };
    init();
  }, [itemId, type]);

  const fetchClasses = async () => {
    try {
      const { data } = await api.get('/classes');
      setClasses(data);
    } catch (err) {
      console.error('Failed to fetch classes', err);
    }
  };

  const fetchItem = async () => {
    try {
      // Since backend doesn't support GET /:id, we fetch all for subject and find it
      const { data } = await api.get(`/${currentConfig.endpoint}?subjectId=${subjectId}`);
      const item = data.find(i => i.id === itemId);
      
      if (item) {
        const formatted = { ...item };
        // Format dates for input type="date" (YYYY-MM-DD)
        if (formatted.date) formatted.date = new Date(formatted.date).toISOString().split('T')[0];
        if (formatted.dueDate) formatted.dueDate = new Date(formatted.dueDate).toISOString().split('T')[0];
        setFormData(formatted);
      } else {
        setError('Item not found');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch item details');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = { ...formData, subjectId };
      
      // Ensure dates are ISO strings for Prisma
      if (payload.date) payload.date = new Date(payload.date).toISOString();
      if (payload.dueDate) payload.dueDate = new Date(payload.dueDate).toISOString();

      // Clean up empty optional fields
      if (!payload.classId) delete payload.classId;

      if (itemId) {
        await api.put(`/${currentConfig.endpoint}/${itemId}`, payload);
      } else {
        await api.post(`/${currentConfig.endpoint}`, payload);
      }
      navigate(`/e-learning/${subjectId}`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to save item. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  if (!currentConfig) {
    return (
        <div className="p-8 text-center">
            <h2 className="text-xl text-red-600">Invalid Item Type</h2>
            <button onClick={() => navigate(-1)} className="mt-4 text-indigo-600 hover:underline">Go Back</button>
        </div>
    );
  }

  if (initialLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader className="animate-spin text-indigo-600" size={32} />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate(`/e-learning/${subjectId}`)}
            className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {itemId ? 'Edit' : 'Add'} {currentConfig.title}
            </h1>
            <p className="text-gray-500 text-sm mt-1">Fill in the details below</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {currentConfig.fields.map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                
                {field.type === 'textarea' ? (
                  <textarea
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all h-40 resize-none"
                    required={field.required}
                    placeholder={`Enter ${field.label.toLowerCase()}...`}
                  />
                ) : field.type === 'questions' ? (
                  <div className="space-y-3">
                    {(formData[field.name] || []).map((question, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={question}
                          onChange={(e) => {
                            const newQuestions = [...(formData[field.name] || [])];
                            newQuestions[index] = e.target.value;
                            setFormData({ ...formData, [field.name]: newQuestions });
                          }}
                          className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                          placeholder={`Question ${index + 1}`}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newQuestions = (formData[field.name] || []).filter((_, i) => i !== index);
                            setFormData({ ...formData, [field.name]: newQuestions });
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, [field.name]: [...(formData[field.name] || []), ''] });
                      }}
                      className="flex items-center gap-2 text-sm text-indigo-600 font-medium hover:text-indigo-700"
                    >
                      <Plus size={16} /> Add Question
                    </button>
                  </div>
                ) : field.type === 'select' ? (
                  <div className="relative">
                    <select
                      value={formData[field.name] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all appearance-none bg-white"
                      required={field.required}
                    >
                      <option value="">Select Class...</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      ▼
                    </div>
                  </div>
                ) : (
                  <input
                    type={field.type || 'text'}
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    required={field.required}
                    placeholder={`Enter ${field.label.toLowerCase()}...`}
                  />
                )}
              </div>
            ))}

            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate(`/dashboard/e-learning/${subjectId}`)}
                className="px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                {loading ? 'Saving...' : 'Save Details'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
