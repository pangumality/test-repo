import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Shield, 
  Calendar, 
  School, 
  LogOut,
  Camera
} from 'lucide-react';

const Profile = () => {
  const { currentUser } = useOutletContext() || {};
  const navigate = useNavigate();
  const [user, setUser] = useState(currentUser || null);

  useEffect(() => {
    // Fallback to local storage if context is missing
    if (!user) {
      const storedUser = JSON.parse(localStorage.getItem('currentUser'));
      if (storedUser) {
        setUser(storedUser);
      } else {
        // If no user found, maybe redirect to login?
        // navigate('/login');
      }
    }
  }, [user, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('current_demo_user_id');
    navigate('/login');
    window.location.reload();
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>

      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-12 mb-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-lg">
                <div className="w-full h-full rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 text-3xl font-bold">
                  {user.firstName?.[0] || 'U'}
                </div>
              </div>
              <button className="absolute bottom-2 right-2 p-1.5 bg-white rounded-full shadow-md text-slate-500 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={16} />
              </button>
            </div>
            <div className="flex gap-3">
              <span className="bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-medium border border-indigo-100 capitalize">
                {user.role === 'school_admin' ? 'School Admin' : user.role}
              </span>
              {user.isActive && (
                <span className="bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-sm font-medium border border-emerald-100">
                  Active
                </span>
              )}
            </div>
          </div>
          
          <div>
            <h2 className="text-3xl font-bold text-slate-800 mb-1">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-slate-500 flex items-center gap-2">
              <Shield size={16} />
              ID: <span className="font-mono text-sm">{user.id}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <User className="text-indigo-500" size={20} />
            Personal Information
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="text-slate-400 mt-1" size={18} />
              <div>
                <p className="text-sm text-slate-500 mb-0.5">Email Address</p>
                <p className="text-slate-800 font-medium">{user.email || 'Not provided'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="text-slate-400 mt-1" size={18} />
              <div>
                <p className="text-sm text-slate-500 mb-0.5">Phone Number</p>
                <p className="text-slate-800 font-medium">{user.phone || 'Not provided'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="text-slate-400 mt-1" size={18} />
              <div>
                <p className="text-sm text-slate-500 mb-0.5">Member Since</p>
                <p className="text-slate-800 font-medium">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Academic/Work Information */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <School className="text-pink-500" size={20} />
            {user.role === 'student' ? 'Academic Information' : 'Work Information'}
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <School className="text-slate-400 mt-1" size={18} />
              <div>
                <p className="text-sm text-slate-500 mb-0.5">School</p>
                <p className="text-slate-800 font-medium">{user.school?.name || 'School Information Not Available'}</p>
              </div>
            </div>
            
            {user.role === 'student' && (
              <>
                <div className="flex items-start gap-3">
                  <User className="text-slate-400 mt-1" size={18} />
                  <div>
                    <p className="text-sm text-slate-500 mb-0.5">Class & Section</p>
                    <p className="text-slate-800 font-medium">{user.className || 'X'} - {user.section || 'A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="text-slate-400 mt-1" size={18} />
                  <div>
                    <p className="text-sm text-slate-500 mb-0.5">Roll Number</p>
                    <p className="text-slate-800 font-medium">{user.rollNumber || 'N/A'}</p>
                  </div>
                </div>
              </>
            )}

            {(user.role === 'teacher' || user.role === 'admin' || user.role === 'school_admin') && (
              <div className="flex items-start gap-3">
                <MapPin className="text-slate-400 mt-1" size={18} />
                <div>
                  <p className="text-sm text-slate-500 mb-0.5">Department</p>
                  <p className="text-slate-800 font-medium">
                    {user.department || (['admin', 'school_admin'].includes(user.role) ? 'Administration' : 'Academics')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;