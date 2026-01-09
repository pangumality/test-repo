import React, { useRef, useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import api from '../utils/api';
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

const formatDate = (value) => {
  if (!value) return 'N/A';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString();
};

const Profile = () => {
  const { currentUser } = useOutletContext() || {};
  const navigate = useNavigate();
  const [user, setUser] = useState(currentUser || null);
  const logoInputRef = useRef(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState('');

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

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    api
      .get('/me')
      .then(({ data }) => {
        setUser(data);
        localStorage.setItem('currentUser', JSON.stringify(data));
      })
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('current_demo_user_id');
    navigate('/login');
    window.location.reload();
  };

  const uploadSchoolLogo = async (file) => {
    if (!file) return;
    setLogoUploading(true);
    setLogoError('');
    try {
      const formData = new FormData();
      formData.append('logo', file);
      const { data } = await api.post('/schools/me/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const nextUser = {
        ...user,
        school: {
          ...(user.school || {}),
          logo: data?.logo || data?.school?.logo || user.school?.logo || null
        }
      };
      setUser(nextUser);
      localStorage.setItem('currentUser', JSON.stringify(nextUser));
    } catch (err) {
      setLogoError(err?.response?.data?.error || 'Failed to upload school logo');
    } finally {
      setLogoUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
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
                {user.role === 'school_admin' ? (
                  user.school?.logo ? (
                    <img
                      src={user.school.logo}
                      alt={user.school?.name || 'School'}
                      className="w-full h-full rounded-xl object-contain bg-white"
                    />
                  ) : (
                    <div className="w-full h-full rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 text-3xl font-bold">
                      {user.school?.name?.[0] || 'S'}
                    </div>
                  )
                ) : user.portrait ? (
                  <img
                    src={user.portrait}
                    alt={`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User'}
                    className="w-full h-full rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 text-3xl font-bold">
                    {user.firstName?.[0] || 'U'}
                  </div>
                )}
              </div>
              {user.role === 'school_admin' ? (
                <>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => uploadSchoolLogo(e.target.files?.[0] || null)}
                  />
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={logoUploading}
                    className={`absolute bottom-2 right-2 p-1.5 bg-white rounded-full shadow-md transition-opacity ${
                      logoUploading
                        ? 'text-slate-300 cursor-not-allowed opacity-100'
                        : 'text-slate-500 hover:text-indigo-600 opacity-100 group-hover:opacity-100'
                    }`}
                  >
                    <Camera size={16} />
                  </button>
                </>
              ) : null}
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
                  {formatDate(user.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <User className="text-slate-400 mt-1" size={18} />
              <div>
                <p className="text-sm text-slate-500 mb-0.5">Gender</p>
                <p className="text-slate-800 font-medium capitalize">{user.gender || 'Not provided'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Academic/Work Information */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <School className="text-pink-500" size={20} />
            {user.role === 'student'
              ? 'Academic Information'
              : user.role === 'parent'
                ? 'Family Information'
                : 'Work Information'}
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <School className="text-slate-400 mt-1" size={18} />
              <div>
                <p className="text-sm text-slate-500 mb-0.5">School</p>
                <p className="text-slate-800 font-medium">
                  {user.school?.name || 'School Information Not Available'}
                  {user.school?.code ? <span className="text-slate-500"> ({user.school.code})</span> : null}
                </p>
              </div>
            </div>

            {user.school?.address && (
              <div className="flex items-start gap-3">
                <MapPin className="text-slate-400 mt-1" size={18} />
                <div>
                  <p className="text-sm text-slate-500 mb-0.5">School Address</p>
                  <p className="text-slate-800 font-medium">{user.school.address}</p>
                </div>
              </div>
            )}
            {user.role === 'school_admin' && logoError ? (
              <p className="text-xs text-red-600">{logoError}</p>
            ) : null}
            
            {user.role === 'student' && (
              <>
                <div className="flex items-start gap-3">
                  <User className="text-slate-400 mt-1" size={18} />
                  <div>
                    <p className="text-sm text-slate-500 mb-0.5">Class & Section</p>
                    <p className="text-slate-800 font-medium">
                      {(user.student?.klass?.name || 'N/A')}{user.student?.section ? ` - ${user.student.section}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="text-slate-400 mt-1" size={18} />
                  <div>
                    <p className="text-sm text-slate-500 mb-0.5">Grade</p>
                    <p className="text-slate-800 font-medium">{user.student?.grade || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="text-slate-400 mt-1" size={18} />
                  <div>
                    <p className="text-sm text-slate-500 mb-0.5">Date of Birth</p>
                    <p className="text-slate-800 font-medium">{formatDate(user.student?.dateOfBirth)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="text-slate-400 mt-1" size={18} />
                  <div>
                    <p className="text-sm text-slate-500 mb-0.5">Blood Group</p>
                    <p className="text-slate-800 font-medium">{user.student?.bloodGroup || 'N/A'}</p>
                  </div>
                </div>
              </>
            )}

            {user.role === 'teacher' && (
              <>
                <div className="flex items-start gap-3">
                  <Shield className="text-slate-400 mt-1" size={18} />
                  <div>
                    <p className="text-sm text-slate-500 mb-0.5">Employee Number</p>
                    <p className="text-slate-800 font-medium">{user.teacher?.employeeNumber || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="text-slate-400 mt-1" size={18} />
                  <div>
                    <p className="text-sm text-slate-500 mb-0.5">Qualifications</p>
                    <p className="text-slate-800 font-medium">{user.teacher?.qualifications || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="text-slate-400 mt-1" size={18} />
                  <div>
                    <p className="text-sm text-slate-500 mb-0.5">Work Experience</p>
                    <p className="text-slate-800 font-medium">{user.teacher?.workExperience || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <School className="text-slate-400 mt-1" size={18} />
                  <div className="w-full">
                    <p className="text-sm text-slate-500 mb-0.5">Assigned Classes & Subjects</p>
                    {Array.isArray(user.teacher?.assignments) && user.teacher.assignments.length > 0 ? (
                      <div className="space-y-2">
                        {user.teacher.assignments.map((a, idx) => (
                          <div
                            key={`${a.classId || 'class'}-${a.subjectId || 'subject'}-${idx}`}
                            className="flex items-center justify-between gap-4"
                          >
                            <p className="text-slate-800 font-medium">{a.className || 'N/A'}</p>
                            <p className="text-slate-500 text-sm">{a.subjectName || 'N/A'}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-800 font-medium">N/A</p>
                    )}
                  </div>
                </div>
              </>
            )}

            {user.role === 'parent' && (
              <div className="flex items-start gap-3">
                <User className="text-slate-400 mt-1" size={18} />
                <div className="w-full">
                  <p className="text-sm text-slate-500 mb-0.5">Children</p>
                  {user.parent?.children?.length ? (
                    <div className="space-y-2">
                      {user.parent.children.map((c) => (
                        <div key={c.studentId} className="flex items-center justify-between gap-4">
                          <p className="text-slate-800 font-medium">
                            {c.student?.user ? `${c.student.user.firstName} ${c.student.user.lastName}`.trim() : c.studentId}
                          </p>
                          <p className="text-slate-500 text-sm">
                            {c.student?.klass?.name || 'N/A'}{c.student?.section ? ` - ${c.student.section}` : ''}
                            {c.relationship ? ` • ${c.relationship}` : ''}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-800 font-medium">N/A</p>
                  )}
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
