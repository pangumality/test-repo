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
    </div>
  );
};

export default SchoolDetails;
