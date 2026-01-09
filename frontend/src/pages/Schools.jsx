import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Plus, Edit2, Trash2, School as SchoolIcon, Loader2, X } from 'lucide-react';

const Schools = () => {
  const navigate = useNavigate();
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    logo: '',
    adminEmail: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch schools
  const fetchSchools = async () => {
    try {
      const response = await api.get('/schools');
      setSchools(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching schools:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (school) => {
    setEditingSchool(school);
    setFormData({
      name: school.name,
      code: school.code,
      address: school.address || '',
      phone: school.phone || '',
      email: school.email || '',
      website: school.website || '',
      logo: school.logo || '',
      adminEmail: ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this school?')) {
      try {
        await api.delete(`/schools/${id}`);
        fetchSchools();
      } catch (err) {
        console.error('Error deleting school:', err);
        alert('Failed to delete school');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (editingSchool) {
        await api.put(`/schools/${editingSchool.id}`, formData);
      } else {
        await api.post('/schools', formData);
      }
      setShowModal(false);
      setEditingSchool(null);
      setFormData({ name: '', code: '', address: '', phone: '', email: '', website: '', logo: '', adminEmail: '' });
      fetchSchools();
    } catch (err) {
      console.error('Error saving school:', err);
      setError(err.response?.data?.error || 'Failed to save school');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <SchoolIcon className="text-blue-600" />
          Manage Schools
        </h1>
        <button 
          onClick={() => {
            setEditingSchool(null);
            setFormData({ name: '', code: '', address: '', phone: '', email: '', website: '', logo: '', adminEmail: '' });
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add School
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schools.map((school) => (
          <div 
            key={school.id} 
            onClick={() => navigate(`/schools/${school.id}`)}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="bg-blue-50 p-3 rounded-lg overflow-hidden w-12 h-12 flex items-center justify-center">
                {school.logo ? (
                  <img src={school.logo} alt={school.name} className="w-full h-full object-contain" />
                ) : (
                  <SchoolIcon className="text-blue-600" size={24} />
                )}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(school);
                  }}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(school.id);
                  }}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-gray-800 mb-2">{school.name}</h3>
            <p className="text-sm text-gray-500 mb-4 font-mono bg-gray-50 inline-block px-2 py-1 rounded">
              Code: {school.code}
            </p>
            
            <div className="space-y-2 text-sm text-gray-600">
              {school.address && <p>📍 {school.address}</p>}
              {school.phone && <p>📞 {school.phone}</p>}
              {school.email && <p>✉️ {school.email}</p>}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">
                {editingSchool ? 'Edit School' : 'Add New School'}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded text-sm">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">School Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. The Asian School"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">School Code *</label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. TAS001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {!editingSchool && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-sm font-bold text-blue-800 mb-2">School Admin Account</h3>
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">Admin Email *</label>
                    <input
                      type="email"
                      name="adminEmail"
                      value={formData.adminEmail || ''}
                      onChange={handleInputChange}
                      required={!editingSchool}
                      className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="admin@school.com"
                    />
                    <p className="text-xs text-blue-600 mt-1">
                      Default password will be: <strong>School@admin</strong>
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex justify-center items-center"
                >
                  {submitting ? <Loader2 className="animate-spin" size={20} /> : 'Save School'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schools;
