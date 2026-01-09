import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { 
  School, 
  Users, 
  GraduationCap, 
  Home, 
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Globe,
  Loader2
} from 'lucide-react';

const StatCard = ({ icon: Icon, title, value, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
    <div className={`p-3 rounded-lg ${color}`}>
      <Icon className="text-white" size={24} />
    </div>
    <div>
      <p className="text-sm text-gray-500 uppercase font-bold tracking-wider">{title}</p>
      <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
    </div>
  </div>
);

const SchoolDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSchool = async () => {
      try {
        const response = await api.get(`/schools/${id}`);
        setSchool(response.data);
      } catch (err) {
        console.error('Error fetching school details:', err);
        setError('Failed to load school details');
      } finally {
        setLoading(false);
      }
    };

    fetchSchool();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  if (error || !school) {
    return (
      <div className="p-6">
        <button 
          onClick={() => navigate('/schools')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} />
          Back to Schools
        </button>
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error || 'School not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/schools')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Schools
        </button>
      </div>

      {/* Hero Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-32"></div>
        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-12 mb-6">
            <div className="bg-white p-4 rounded-2xl shadow-lg">
              <School size={48} className="text-blue-600" />
            </div>
            <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-mono font-medium">
              Code: {school.code}
            </span>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{school.name}</h1>
          
          <div className="flex flex-wrap gap-6 text-gray-600 mt-4">
            {school.email && (
              <div className="flex items-center gap-2">
                <Mail size={18} />
                <span>{school.email}</span>
              </div>
            )}
            {school.phone && (
              <div className="flex items-center gap-2">
                <Phone size={18} />
                <span>{school.phone}</span>
              </div>
            )}
            {school.website && (
              <div className="flex items-center gap-2">
                <Globe size={18} />
                <a href={school.website} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                  {school.website}
                </a>
              </div>
            )}
            {school.address && (
              <div className="flex items-center gap-2">
                <MapPin size={18} />
                <span>{school.address}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Admin Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">School Admin</h2>
        {school.admin ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-700">
            <div className="flex items-center gap-2">
              <Users size={18} />
              <span>{school.admin.firstName} {school.admin.lastName}</span>
            </div>
            {school.admin.email && (
              <div className="flex items-center gap-2">
                <Mail size={18} />
                <span>{school.admin.email}</span>
              </div>
            )}
            {school.admin.phone && (
              <div className="flex items-center gap-2">
                <Phone size={18} />
                <span>{school.admin.phone}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-gray-500">No admin assigned to this school.</div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon={GraduationCap} 
          title="Students" 
          value={school.stats?.students || 0}
          color="bg-blue-500"
        />
        <StatCard 
          icon={Users} 
          title="Teachers" 
          value={school.stats?.teachers || 0}
          color="bg-emerald-500"
        />
        <StatCard 
          icon={Home} 
          title="Classes" 
          value={school.stats?.classes || 0}
          color="bg-violet-500"
        />
      </div>

      {/* Additional Info / Tabs could go here */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">About School</h2>
        <p className="text-gray-600 leading-relaxed">
          {school.description || 'No description available for this school.'}
        </p>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">Edit School</h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">School Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                <input
                  type="text"
                  name="logo"
                  value={formData.logo}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={2}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://..."
                />
              </div>

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
                  {submitting ? <Loader2 className="animate-spin" size={20} /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolDetails;
