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

const toSameOriginUploadsUrl = (value) => {
  if (!value || typeof value !== 'string') return value;
  if (value.startsWith('/uploads/')) return value;
  const idx = value.indexOf('/uploads/');
  if (idx === -1) return value;
  return value.slice(idx);
};

const Profile = () => {
  const { currentUser } = useOutletContext() || {};
  const navigate = useNavigate();
  const [user, setUser] = useState(currentUser || null);
  const logoInputRef = useRef(null);
  const portraitInputRef = useRef(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState('');
  const [portraitUploading, setPortraitUploading] = useState(false);
  const [portraitError, setPortraitError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: ''
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

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

  useEffect(() => {
    if (!user) return;
    if (isEditing) return;
    setProfileForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
      gender: user.gender || ''
    });
  }, [user, isEditing]);

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
      await api.post('/schools/me/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const { data: refreshed } = await api.get('/me');
      setUser(refreshed);
      localStorage.setItem('currentUser', JSON.stringify(refreshed));
      window.location.reload();
    } catch (err) {
      setLogoError(err?.response?.data?.error || 'Failed to upload school logo');
    } finally {
      setLogoUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const uploadPortrait = async (file) => {
    if (!file) return;
    setPortraitUploading(true);
    setPortraitError('');
    try {
      const data = new FormData();
      data.append('image', file);
      const res = await api.post('/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const url = res.data && res.data.url;
      if (!url) {
        throw new Error('No URL returned');
      }
      await api.put('/me', { portrait: url });
      const { data: refreshed } = await api.get('/me');
      setUser(refreshed);
      localStorage.setItem('currentUser', JSON.stringify(refreshed));
    } catch (err) {
      setPortraitError(err?.response?.data?.error || 'Failed to upload profile picture');
    } finally {
      setPortraitUploading(false);
      if (portraitInputRef.current) portraitInputRef.current.value = '';
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setProfileError('');
    setProfileSuccess('');
    setProfileForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      gender: user?.gender || ''
    });
  };

  const saveProfile = async () => {
    setProfileSaving(true);
    setProfileError('');
    setProfileSuccess('');
    try {
      await api.put('/me', {
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        email: profileForm.email,
        phone: profileForm.phone,
        gender: profileForm.gender
      });
      const { data } = await api.get('/me');
      setUser(data);
      localStorage.setItem('currentUser', JSON.stringify(data));
      setIsEditing(false);
      setProfileSuccess('Profile updated');
    } catch (err) {
      setProfileError(err?.response?.data?.error || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordError('');
    setPasswordSuccess('');
    try {
      const { oldPassword, newPassword, confirmPassword } = passwordForm;
      if (!oldPassword || !newPassword) {
        setPasswordError('Old password and new password are required');
        return;
      }
      if (newPassword !== confirmPassword) {
        setPasswordError('New password and confirm password do not match');
        return;
      }
      await api.put('/me', { oldPassword, newPassword });
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordSuccess('Password updated');
    } catch (err) {
      setPasswordError(err?.response?.data?.error || 'Failed to update password');
    } finally {
      setPasswordSaving(false);
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
                      src={toSameOriginUploadsUrl(user.school.logo)}
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
                    src={toSameOriginUploadsUrl(user.portrait)}
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
              ) : user.role === 'teacher' ? (
                <>
                  <input
                    ref={portraitInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => uploadPortrait(e.target.files?.[0] || null)}
                  />
                  <button
                    type="button"
                    onClick={() => portraitInputRef.current?.click()}
                    disabled={portraitUploading}
                    className={`absolute bottom-2 right-2 p-1.5 bg-white rounded-full shadow-md transition-opacity ${
                      portraitUploading
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
          <div className="flex items-start justify-between gap-4 mb-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <User className="text-indigo-500" size={20} />
              Personal Information
            </h3>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    disabled={profileSaving}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveProfile}
                    disabled={profileSaving}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {profileSaving ? 'Saving...' : 'Save'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(true);
                    setProfileError('');
                    setProfileSuccess('');
                  }}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium border border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                >
                  Edit
                </button>
              )}
            </div>
          </div>
          {profileError ? <p className="text-sm text-red-600 mb-3">{profileError}</p> : null}
          {profileSuccess ? <p className="text-sm text-emerald-600 mb-3">{profileSuccess}</p> : null}
          <div className="space-y-4">
            {isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-slate-500 mb-1">First Name</p>
                  <input
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm((p) => ({ ...p, firstName: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Last Name</p>
                  <input
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm((p) => ({ ...p, lastName: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
              </div>
            ) : null}
            <div className="flex items-start gap-3">
              <Mail className="text-slate-400 mt-1" size={18} />
              <div>
                <p className="text-sm text-slate-500 mb-0.5">Email Address</p>
                {isEditing ? (
                  <input
                    value={profileForm.email}
                    onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                ) : (
                  <p className="text-slate-800 font-medium">{user.email || 'Not provided'}</p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="text-slate-400 mt-1" size={18} />
              <div>
                <p className="text-sm text-slate-500 mb-0.5">Phone Number</p>
                {isEditing ? (
                  <input
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                ) : (
                  <p className="text-slate-800 font-medium">{user.phone || 'Not provided'}</p>
                )}
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
                {isEditing ? (
                  <select
                    value={profileForm.gender}
                    onChange={(e) => setProfileForm((p) => ({ ...p, gender: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
                  >
                    <option value="">Not provided</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                ) : (
                  <p className="text-slate-800 font-medium capitalize">{user.gender || 'Not provided'}</p>
                )}
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

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Shield className="text-indigo-500" size={20} />
          Change Password
        </h3>
        {passwordError ? <p className="text-sm text-red-600 mb-3">{passwordError}</p> : null}
        {passwordSuccess ? <p className="text-sm text-emerald-600 mb-3">{passwordSuccess}</p> : null}
        <form onSubmit={changePassword} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-slate-500 mb-1">Old Password</p>
            <input
              type="password"
              value={passwordForm.oldPassword}
              onChange={(e) => setPasswordForm((p) => ({ ...p, oldPassword: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-1">New Password</p>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-1">Confirm Password</p>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={passwordSaving}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {passwordSaving ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
