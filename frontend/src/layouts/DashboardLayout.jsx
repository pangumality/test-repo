import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Bell, 
  MessageSquare, 
  LogOut, 
  User, 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  CreditCard, 
  Library, 
  Home, 
  Bus,
  Radio,
  Trophy,
  Package,
  Menu,
  ArrowLeft,
  RotateCw,
  X,
  School as SchoolIcon,
  FileText,
  Newspaper,
  Clock,
  FileCheck,
  Award,
  ChevronLeft,
  ChevronRight,
  Check,
  CheckCheck,
  Image as ImageIcon,
  ArrowUp,
  Bot,
  Shield
} from 'lucide-react';
import clsx from 'clsx';
import { seedAll } from '../utils/seed';
import MobileDashboardHome from '../components/MobileDashboardHome';
import api from '../utils/api';

const CURRENCY_OPTIONS = [
  { code: 'USD', label: 'US Dollar', symbol: '$', rateFromZMW: 0.055 },
  { code: 'INR', label: 'Indian Rupee', symbol: '₹', rateFromZMW: 4.5 },
  { code: 'ZMW', label: 'Zambian Kwacha', symbol: 'ZMW', rateFromZMW: 1 },
];

const SidebarItem = ({ icon: Icon, label, to, active, onClick, isCollapsed, theme, isDarkMode }) => {
  const activeClasses = clsx(
    'bg-gradient-to-r text-white shadow-lg scale-[1.02]',
    theme?.active || 'from-indigo-500 via-sky-500 to-emerald-500 shadow-indigo-500/40'
  );

  const inactiveClasses = theme?.inactive 
    ? clsx('transition-colors duration-300 hover:translate-x-1', theme.inactive)
    : clsx(
        'bg-transparent hover:shadow-md hover:translate-x-1 transition-colors duration-300',
        isDarkMode 
          ? 'text-slate-100 hover:bg-white/10 hover:text-white' 
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      );

  return (
    <Link
      to={to}
      onClick={onClick}
      className={clsx(
        'group flex items-center gap-3 px-4 py-3 mb-2 rounded-2xl transition-all duration-300 relative overflow-hidden',
        active ? activeClasses : inactiveClasses,
        isCollapsed ? 'justify-center px-2' : ''
      )}
      title={isCollapsed ? label : ''}
    >
      {!isCollapsed && active && (
        <div className="absolute inset-0 bg-white/10 animate-pulse-slow" />
      )}
      <div
        className={clsx(
          'flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-300 shadow-sm',
          active 
            ? 'bg-white/20 text-white backdrop-blur-sm' 
            : clsx(
                (theme?.inactive || isDarkMode) ? 'bg-white/5' : 'bg-slate-100', 
                theme?.icon || (isDarkMode ? 'text-indigo-300' : 'text-indigo-600')
              )
        )}
      >
        <Icon size={18} />
      </div>
      {!isCollapsed && <span className="font-medium whitespace-nowrap overflow-hidden tracking-wide">{label}</span>}
      {!isCollapsed && !active && (
         <ChevronRight size={14} className={clsx("ml-auto opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1", theme?.icon || (isDarkMode ? 'text-indigo-300' : 'text-indigo-600'))} />
      )}
    </Link>
  );
};

const MENU_ITEMS = [
  { 
    icon: LayoutDashboard, 
    label: 'Dashboard', 
    to: '/dashboard',
    theme: { 
      active: 'from-blue-500 to-blue-600 shadow-blue-500/40', 
      icon: 'text-blue-300',
      inactive: 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
    }
  },
  { 
    icon: Calendar, 
    label: 'Attendance', 
    to: '/dashboard/attendance', 
    allowedRoles: ['student','teacher','admin','school_admin'],
    theme: { 
      active: 'from-green-500 to-emerald-600 shadow-green-500/40', 
      icon: 'text-green-300',
      inactive: 'bg-green-600 hover:bg-green-500 text-white shadow-sm'
    }
  },
  { 
    icon: MessageSquare, 
    label: 'Messages', 
    to: '/dashboard/messages', 
    allowedRoles: ['student','teacher','admin','school_admin','parent'],
    theme: { 
      active: 'from-yellow-400 to-orange-500 shadow-yellow-500/40', 
      icon: 'text-yellow-300',
      inactive: 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-sm'
    }
  },
  { 
    icon: Bell, 
    label: 'Notice Board', 
    to: '/dashboard/notices', 
    allowedRoles: ['student','teacher','school_admin','parent'],
    theme: { 
      active: 'from-orange-400 to-red-500 shadow-orange-500/40', 
      icon: 'text-orange-300',
      inactive: 'bg-orange-600 hover:bg-orange-500 text-white shadow-sm'
    }
  },
  { 
    icon: Newspaper, 
    label: 'Newsletters', 
    to: '/dashboard/newsletters', 
    allowedRoles: ['student','teacher','admin','school_admin','parent'],
    theme: { 
      active: 'from-purple-500 to-indigo-600 shadow-purple-500/40', 
      icon: 'text-purple-300',
      inactive: 'bg-purple-600 hover:bg-purple-500 text-white shadow-sm'
    }
  },
  { 
    icon: ImageIcon, 
    label: 'Gallery', 
    to: '/dashboard/gallery', 
    allowedRoles: ['student','teacher','admin','school_admin','parent'],
    theme: { 
      active: 'from-pink-500 to-rose-600 shadow-pink-500/40', 
      icon: 'text-pink-300',
      inactive: 'bg-pink-600 hover:bg-pink-500 text-white shadow-sm'
    }
  },
  { 
    icon: FileCheck, 
    label: 'Leaves', 
    to: '/dashboard/leaves', 
    allowedRoles: ['student','parent','admin','school_admin','teacher'],
    theme: { 
      active: 'from-red-500 to-red-700 shadow-red-500/40', 
      icon: 'text-red-300',
      inactive: 'bg-red-600 hover:bg-red-500 text-white shadow-sm'
    }
  },
  { 
    icon: Clock, 
    label: 'Time Table', 
    to: '/dashboard/timetable', 
    allowedRoles: ['student','teacher','admin','school_admin','parent'],
    theme: { 
      active: 'from-cyan-400 to-blue-500 shadow-cyan-500/40', 
      icon: 'text-cyan-300',
      inactive: 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm'
    }
  },
  { 
    icon: Award, 
    label: 'Certificates', 
    to: '/dashboard/certificates', 
    allowedRoles: ['student','parent','admin','school_admin'],
    theme: { 
      active: 'from-teal-400 to-teal-600 shadow-teal-500/40', 
      icon: 'text-teal-300',
      inactive: 'bg-teal-600 hover:bg-teal-500 text-white shadow-sm'
    }
  },
  { 
    icon: Users, 
    label: 'Teachers', 
    to: '/dashboard/teachers', 
    excludedRoles: ['student','teacher','parent'],
    theme: { 
      active: 'from-indigo-500 to-violet-600 shadow-indigo-500/40', 
      icon: 'text-indigo-300',
      inactive: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
    }
  },
  { 
    icon: GraduationCap, 
    label: 'Students', 
    to: '/dashboard/students', 
    allowedRoles: ['admin','school_admin'],
    theme: { 
      active: 'from-emerald-400 to-green-600 shadow-emerald-500/40', 
      icon: 'text-emerald-300',
      inactive: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
    }
  },
  { 
    icon: Home, 
    label: 'Classes', 
    to: '/dashboard/classes', 
    allowedRoles: ['teacher','admin','school_admin'],
    theme: { 
      active: 'from-lime-400 to-green-500 shadow-lime-500/40', 
      icon: 'text-lime-300',
      inactive: 'bg-lime-600 hover:bg-lime-500 text-white shadow-sm'
    }
  },
  { 
    icon: SchoolIcon, 
    label: 'Schools', 
    to: '/dashboard/schools', 
    allowedRoles: ['admin'],
    theme: { 
      active: 'from-amber-400 to-yellow-500 shadow-amber-500/40', 
      icon: 'text-amber-300',
      inactive: 'bg-amber-600 hover:bg-amber-500 text-white shadow-sm'
    }
  },
  { 
    icon: BookOpen, 
    label: 'Exams', 
    to: '/dashboard/exams', 
    excludedRoles: ['student','parent'],
    theme: { 
      active: 'from-violet-500 to-purple-600 shadow-violet-500/40', 
      icon: 'text-violet-300',
      inactive: 'bg-violet-600 hover:bg-violet-500 text-white shadow-sm'
    }
  },
  { 
    icon: FileText, 
    label: 'My Exams', 
    to: '/dashboard/student/exams', 
    allowedRoles: ['student'],
    theme: { 
      active: 'from-fuchsia-400 to-pink-600 shadow-fuchsia-500/40', 
      icon: 'text-fuchsia-300',
      inactive: 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white shadow-sm'
    }
  },
  { 
    icon: CreditCard, 
    label: 'Finance', 
    to: '/dashboard/finance', 
    excludedRoles: ['student','teacher','parent'],
    theme: { 
      active: 'from-rose-400 to-red-600 shadow-rose-500/40', 
      icon: 'text-rose-300',
      inactive: 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm'
    }
  },
  { 
    icon: Library, 
    label: 'Library', 
    to: '/dashboard/library', 
    departmentKey: 'library',
    theme: { 
      active: 'from-sky-400 to-blue-500 shadow-sky-500/40', 
      icon: 'text-sky-300',
      inactive: 'bg-sky-600 hover:bg-sky-500 text-white shadow-sm'
    }
  },
  { 
    icon: Home, 
    label: 'Hostel', 
    to: '/dashboard/hostel', 
    departmentKey: 'hostel',
    theme: { 
      active: 'from-teal-500 to-emerald-600 shadow-teal-500/40', 
      icon: 'text-teal-200',
      inactive: 'bg-teal-600 hover:bg-teal-500 text-white shadow-sm'
    }
  },
  { 
    icon: Bus, 
    label: 'Transport', 
    to: '/dashboard/transport', 
    departmentKey: 'transport',
    theme: { 
      active: 'from-yellow-500 to-amber-600 shadow-yellow-500/40', 
      icon: 'text-yellow-200',
      inactive: 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-sm'
    }
  },
  { 
    icon: Radio, 
    label: 'E-Learning', 
    to: '/dashboard/e-learning', 
    allowedRoles: ['student','teacher','admin','school_admin'],
    theme: { 
      active: 'from-blue-600 to-indigo-700 shadow-blue-500/40', 
      icon: 'text-blue-200',
      inactive: 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
    }
  },
  { 
    icon: Radio, 
    label: 'Radio', 
    to: '/dashboard/radio', 
    allowedRoles: ['student','teacher','admin','school_admin'],
    theme: { 
      active: 'from-red-600 to-rose-700 shadow-red-500/40', 
      icon: 'text-red-200',
      inactive: 'bg-red-600 hover:bg-red-500 text-white shadow-sm'
    }
  },
  { 
    icon: BookOpen, 
    label: 'Subjects', 
    to: '/dashboard/subjects', 
    allowedRoles: ['student','teacher','admin','school_admin'],
    theme: { 
      active: 'from-orange-600 to-red-600 shadow-orange-500/40', 
      icon: 'text-orange-200',
      inactive: 'bg-orange-600 hover:bg-orange-500 text-white shadow-sm'
    }
  },
  { 
    icon: Trophy, 
    label: 'Sports', 
    to: '/dashboard/sports', 
    excludedRoles: ['student','teacher','parent'],
    theme: { 
      active: 'from-emerald-600 to-green-700 shadow-emerald-500/40', 
      icon: 'text-emerald-200',
      inactive: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
    }
  },
  { 
    icon: Users, 
    label: 'Group Studies', 
    to: '/dashboard/group-studies', 
    allowedRoles: ['student','teacher','admin','school_admin'],
    theme: { 
      active: 'from-violet-600 to-purple-700 shadow-violet-500/40', 
      icon: 'text-violet-200',
      inactive: 'bg-violet-600 hover:bg-violet-500 text-white shadow-sm'
    }
  },
  { 
    icon: Package, 
    label: 'Inventory', 
    to: '/dashboard/inventory', 
    departmentKey: 'inventory',
    theme: { 
      active: 'from-slate-400 to-gray-500 shadow-slate-500/40', 
      icon: 'text-slate-300',
      inactive: 'bg-slate-600 hover:bg-slate-500 text-white shadow-sm'
    }
  },
  { 
    icon: BookOpen, 
    label: 'Academic', 
    to: '/dashboard/academic', 
    allowedRoles: ['student', 'teacher', 'school_admin', 'admin'],
    theme: { 
      active: 'from-indigo-600 to-blue-700 shadow-indigo-500/40', 
      icon: 'text-indigo-200',
      inactive: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
    }
  },
  { 
    icon: Shield, 
    label: 'Departments', 
    to: '/dashboard/departments', 
    allowedRoles: ['school_admin'],
    theme: { 
      active: 'from-pink-600 to-rose-700 shadow-pink-500/40', 
      icon: 'text-pink-200',
      inactive: 'bg-pink-600 hover:bg-pink-500 text-white shadow-sm'
    }
  },
];

const DashboardLayout = ({ theme = 'light', setTheme }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // For mobile
  const [currentUser, setCurrentUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [currency, setCurrency] = useState(() => localStorage.getItem('currency') || 'USD');
  const [departmentAccess, setDepartmentAccess] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);
  const isMobile = window.innerWidth < 768;
  const logoUrl = import.meta.env.VITE_LOGO_URL || '/logo.jpg';
  
  const isDarkMode = theme === 'dark';
  const topBottomBackground = isDarkMode
    ? 'linear-gradient(90deg, #05081a 0%, #0b1029 100%)'
    : '#ffffff';

  const appBgClass = 'bg-slate-50';
  const themeVars = {};

  const currencyConfig =
    CURRENCY_OPTIONS.find((c) => c.code === currency) ||
    CURRENCY_OPTIONS.find((c) => c.code === 'ZMW');

  const formatCurrencyFromBase = (amount) => {
    const numeric = Number(amount || 0);
    const factor = currencyConfig?.rateFromZMW || 1;
    const converted = numeric * factor;
    const symbol = currencyConfig?.symbol || 'ZMW';
    return `${symbol} ${converted.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  const convertAmountToBase = (amount) => {
    const numeric = Number(amount || 0);
    const factor = currencyConfig?.rateFromZMW || 1;
    if (!factor) return numeric;
    return numeric / factor;
  };

  const scrollToTopAll = (behavior = 'auto') => {
    const el = scrollContainerRef.current;
    if (el && typeof el.scrollTo === 'function') {
      el.scrollTo({ top: 0, behavior });
    }
    window.scrollTo({ top: 0, behavior });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  useEffect(() => {
    const loadUser = () => {
      const savedUserId = localStorage.getItem('current_demo_user_id');
      // Also check authToken
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }

      let foundUser = null;
      
      const teachers = JSON.parse(localStorage.getItem('teachers:doonites') || '[]');
      const students = JSON.parse(localStorage.getItem('students:doonites') || '[]');
      const admins = JSON.parse(localStorage.getItem('admins:doonites') || '[]');
      const librarians = JSON.parse(localStorage.getItem('librarians:doonites') || '[]');
      const parents = JSON.parse(localStorage.getItem('parents:doonites') || '[]');
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));

      const allUsers = [...admins, ...teachers, ...librarians, ...students, ...parents];

      // Prioritize the currentUser from login
      if (currentUser) {
        foundUser = currentUser;
      } else if (allUsers.length === 0) {
        seedAll();
        return; 
      } else if (savedUserId) {
        foundUser = allUsers.find(u => u.id === savedUserId);
      }

      if (!foundUser) {
        if (admins.length > 0) foundUser = admins[0];
        else if (teachers.length > 0) foundUser = teachers[0];
      }

      setCurrentUser(foundUser);
    };

    loadUser();
    window.addEventListener('storage', loadUser);
    return () => window.removeEventListener('storage', loadUser);
  }, [navigate]);

  useEffect(() => {
    const fetchDepartmentsForUser = async () => {
      if (!currentUser) {
        setDepartmentAccess([]);
        return;
      }
      try {
        const { data } = await api.get('/me/departments');
        setDepartmentAccess(Array.isArray(data) ? data : []);
      } catch {
        setDepartmentAccess([]);
      }
    };
    fetchDepartmentsForUser();
  }, [currentUser]);

  useEffect(() => {
    scrollToTopAll('auto');
    requestAnimationFrame(() => scrollToTopAll('auto'));
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currency) {
      localStorage.setItem('currency', currency);
    }
  }, [currency]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  };

  const markAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    if (notification.activityType === 'MESSAGE') {
      navigate('/dashboard/messages');
    } else if (notification.activityType === 'LEAVE_REQUEST') {
      navigate('/dashboard/leaves');
    } else if (notification.activityType === 'HOMEWORK') {
      navigate('/dashboard/e-learning');
    }
    // Add other navigations as needed
    
    setShowNotifications(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('current_demo_user_id');
    navigate('/login');
    window.location.reload(); // Ensure state clears
  };

  const handleScroll = (e) => {
    if (e.target.scrollTop > 300) {
      setShowScrollTop(true);
    } else {
      setShowScrollTop(false);
    }
  };

  const scrollToTop = () => {
    scrollToTopAll('smooth');
  };

  // Handle Mobile Header
  if (isMobile) {
    return (
      <div className={clsx(
        "min-h-screen flex flex-col relative overflow-hidden",
        isDarkMode ? "bg-slate-950" : "bg-slate-50"
      )}>
        {/* Mobile Header - Curved */}
        <div 
          className={clsx(
            "pt-6 pb-16 px-6 rounded-b-[40px] shadow-xl relative z-10 transition-all duration-300",
            isDarkMode ? "text-white" : "text-slate-800"
          )}
          style={{ background: topBottomBackground }}
        >
          <div className={clsx(
            "absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] to-transparent",
            isDarkMode ? "bg-white/10 from-white/20" : "bg-slate-900/5 from-slate-900/10"
          )}></div>
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="flex items-center gap-3">
               <button onClick={() => setMobileMenuOpen(true)}>
                 <Menu size={24} />
               </button>
               {currentUser?.school?.logo ? (
                 <img src={currentUser.school.logo} alt="school logo" className="w-10 h-10 rounded-full object-cover shadow-lg shadow-black/20" />
               ) : logoUrl ? (
                 <img src={logoUrl} alt="logo" className="w-8 h-8 rounded-full object-cover shadow-lg shadow-black/20" />
               ) : null}
               <span className="font-medium text-lg truncate max-w-[200px]">
                 {currentUser?.school?.name || 'doonITes ERP'}
               </span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className={clsx("uppercase tracking-wide", isDarkMode ? "text-indigo-100" : "text-slate-500")}>Currency</span>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className={clsx(
                  "border text-[11px] px-2 py-1 rounded-md focus:outline-none focus:ring-1",
                  isDarkMode 
                    ? "bg-white/10 border-white/40 text-white focus:ring-white/60" 
                    : "bg-white/50 border-slate-300 text-slate-800 focus:ring-slate-400"
                )}
              >
                {CURRENCY_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.code}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="text-center">
            <h1 className="text-2xl font-light mb-1">
              Hi!{' '}
              {currentUser?.role === 'school_admin'
                ? currentUser?.school?.name || currentUser?.firstName || 'User'
                : currentUser
                  ? currentUser.firstName
                  : 'User'}
            </h1>
            <p className="text-sm opacity-90">
              Role: {currentUser ? currentUser.role : '...'}
            </p>
            {currentUser && currentUser.role === 'student' && (
              <p className="text-sm opacity-90">Class: X - D</p>
            )}
          </div>
        </div>

        {/* Mobile Sidebar Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            
            <div className="relative bg-slate-900 text-slate-100 w-[80%] max-w-sm h-full shadow-2xl flex flex-col animate-slide-in">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {currentUser?.school?.logo ? (
                    <img
                      src={currentUser.school.logo}
                      alt="school logo"
                      className="w-9 h-9 rounded-full object-cover shadow-md shadow-black/40"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center">
                      <SchoolIcon size={18} className="text-slate-100" />
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold leading-tight">
                      {currentUser?.school?.name || 'School Software'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {currentUser?.role ? currentUser.role.replace('_', ' ') : 'Admin Dashboard'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-800 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto py-3">
                 {MENU_ITEMS.map((item) => {
                   if (item.allowedRoles && (!currentUser || !item.allowedRoles.includes(currentUser.role))) return null;
                   if (item.excludedRoles && currentUser && item.excludedRoles.includes(currentUser.role)) return null;
                   if (item.departmentKey) {
                     const role = currentUser?.role;
                     const isGlobal = role === 'admin' || role === 'school_admin';
                     const hasDept = departmentAccess.includes(item.departmentKey);
                     if (!isGlobal && !hasDept) return null;
                   }

                   return (
                     <Link
                       key={item.to}
                       to={item.to}
                       onClick={() => {
                         setMobileMenuOpen(false);
                         scrollToTopAll('auto');
                       }}
                       className={clsx(
                         'flex items-center gap-3 px-4 py-2.5 text-sm',
                         location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to))
                           ? 'bg-slate-800 text-white'
                           : 'text-slate-200 hover:bg-slate-800/70'
                       )}
                     >
                       <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-200">
                         <item.icon size={18} />
                       </div>
                       <span className="font-medium">{item.label}</span>
                     </Link>
                   );
                 })}
              </div>

              <div className="p-4 border-t border-slate-800 bg-slate-950/80">
                <Link 
                to="/dashboard/profile" 
                onClick={() => {
                  setMobileMenuOpen(false);
                    scrollToTopAll('auto');
                  }}
                  className="flex items-center gap-3 mb-4 hover:bg-slate-800 p-2 rounded-lg -mx-2 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-100 font-bold">
                    {currentUser?.firstName?.[0] || 'U'}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-slate-100">
                      {currentUser?.firstName} {currentUser?.lastName}
                    </p>
                    <p className="text-xs text-slate-400 capitalize">{currentUser?.role}</p>
                  </div>
                </Link>






                <button className="flex items-center gap-2 text-red-400 w-full p-2 hover:bg-red-900/40 rounded">
                  <LogOut size={18} />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Content */}
        <main ref={scrollContainerRef} className="flex-1 -mt-6 z-20 px-2 overflow-y-auto pb-20">
          {location.pathname === '/' ? (
            <MobileDashboardHome
              currentUser={currentUser}
              currencyConfig={currencyConfig}
              formatCurrencyFromBase={formatCurrencyFromBase}
            />
          ) : (
             <div className={clsx(
               "rounded-t-3xl min-h-full p-4 shadow-inner",
               isDarkMode ? "bg-slate-900 text-slate-100" : "bg-white text-slate-800"
             )}>
               <Outlet />
             </div>
          )}
        </main>

        {/* Mobile Bottom Navigation */}
        <div 
          className={clsx(
            "fixed bottom-0 left-0 right-0 h-16 flex items-center justify-between px-8 shadow-lg z-50",
            isDarkMode ? "text-white" : "text-slate-600 bg-white"
          )}
          style={{ background: topBottomBackground }}
        >
          <Link to="/dashboard" className="flex flex-col items-center gap-1 opacity-90 hover:opacity-100">
            <Home size={24} />
          </Link>
          <button onClick={() => navigate(-1)} className="flex flex-col items-center gap-1 opacity-90 hover:opacity-100">
            <ArrowLeft size={24} />
          </button>
          <button onClick={() => window.location.reload()} className="flex flex-col items-center gap-1 opacity-90 hover:opacity-100">
            <RotateCw size={24} />
          </button>
           <button onClick={handleLogout} className="flex items-center gap-1 hover:text-red-400 text-red-400">
            <LogOut size={24} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('h-screen flex flex-col font-sans', appBgClass)} style={themeVars}>
      {/* Top Navigation Bar */}
      <header
        className={clsx(
          "h-16 flex items-center justify-between px-6 shadow-md z-20 sticky top-0 transition-colors duration-300",
          isDarkMode ? "text-white" : "text-slate-800 bg-white"
        )}
        style={{ background: topBottomBackground }}
      >
        <div className="flex items-center gap-4">
           {currentUser?.school?.logo ? (
             <img src={currentUser.school.logo} alt="school logo" className="w-10 h-10 rounded-full object-cover shadow-lg shadow-indigo-500/40" />
           ) : logoUrl ? (
             <img src={logoUrl} alt="logo" className="w-8 h-8 rounded-full object-cover shadow-lg shadow-indigo-500/40" />
           ) : (
             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
               <SchoolIcon size={18} className="text-white" />
             </div>
           )}
           <div className="flex flex-col">
             {currentUser?.school?.name ? (
              <>
                <h1 className={clsx(
                  "text-lg font-bold tracking-wide bg-clip-text text-transparent leading-tight",
                  isDarkMode 
                    ? "bg-gradient-to-r from-white via-indigo-200 to-indigo-400"
                    : "bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-900"
                )}>
                  {currentUser.school.name}
                </h1>
                <span className={clsx(
                  "text-[10px] font-medium tracking-wider",
                  isDarkMode ? "text-indigo-300" : "text-indigo-600"
                )}>
                  POWERED BY doonITes ERP (v1.0.4)
                </span>
              </>
            ) : (
              <h1 className={clsx(
                "text-lg font-bold tracking-wide bg-clip-text text-transparent",
                isDarkMode 
                  ? "bg-gradient-to-r from-white via-indigo-200 to-indigo-400"
                  : "bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-900"
              )}>
                doonITes weBBed serVIces ERP (v1.0.4)
              </h1>
            )}
           </div>
        </div>
        <div className="flex items-center gap-6 relative">
          <button
            type="button"
            onClick={() => setTheme && setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={clsx(
              "p-2 rounded-full border flex items-center justify-center transition-colors",
              isDarkMode 
                ? "bg-white/10 hover:bg-white/20 border-white/20 text-white" 
                : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600"
            )}
          >
            {theme === 'dark' ? '🌙' : '☀️'}
          </button>
          <div className="flex items-center gap-2 text-xs">
            <span className={clsx("uppercase tracking-wide", isDarkMode ? "text-indigo-100" : "text-slate-500")}>Currency</span>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className={clsx(
                "border text-xs px-2 py-1 rounded-md focus:outline-none focus:ring-1",
                isDarkMode
                  ? "bg-white/10 border-white/30 text-white focus:ring-white/60"
                  : "bg-slate-50 border-slate-300 text-slate-700 focus:ring-slate-400"
              )}
            >
              {CURRENCY_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.code}
                </option>
              ))}
            </select>
          </div>
           <div className="relative">
             <button 
               className="relative hover:text-gray-300 focus:outline-none"
               onClick={() => setShowNotifications(!showNotifications)}
             >
               <Bell size={20} className={unreadCount > 0 ? "text-yellow-500" : "text-gray-400"} />
               {unreadCount > 0 && (
                 <span className="absolute -top-1 -right-1 bg-red-500 text-xs rounded-full w-4 h-4 flex items-center justify-center">
                   {unreadCount}
                 </span>
               )}
             </button>

             {showNotifications && (
               <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-200 rounded-md shadow-lg border border-gray-200 dark:border-slate-700 z-50 max-h-96 overflow-y-auto">
                 <div className="p-3 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900">
                   <h3 className="font-semibold text-sm">Notifications</h3>
                   {unreadCount > 0 && (
                     <button 
                       onClick={markAllAsRead}
                       className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                     >
                       <CheckCheck size={14} /> Mark all read
                     </button>
                   )}
                 </div>
                 
                 {notifications.length === 0 ? (
                   <div className="p-4 text-center text-gray-500 text-sm">
                     No notifications
                   </div>
                 ) : (
                   <div className="divide-y divide-gray-100">
                     {notifications.map(notification => (
                       <div 
                         key={notification.id}
                         onClick={() => handleNotificationClick(notification)}
                         className={clsx(
                           "p-3 cursor-pointer hover:bg-gray-50 transition-colors",
                           !notification.isRead ? "bg-blue-50/50" : ""
                         )}
                       >
                         <div className="flex justify-between items-start gap-2">
                           <p className={clsx("text-sm", !notification.isRead ? "font-medium" : "text-gray-600")}>
                             {notification.message}
                           </p>
                           {!notification.isRead && (
                             <button 
                               onClick={(e) => markAsRead(notification.id, e)}
                               className="text-gray-400 hover:text-blue-600"
                               title="Mark as read"
                             >
                               <Check size={14} />
                             </button>
                           )}
                         </div>
                         <span className="text-xs text-gray-400 mt-1 block">
                           {new Date(notification.createdAt).toLocaleString()}
                         </span>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
             )}
           </div>

          <button
            type="button"
            onClick={() => navigate('/dashboard/profile')}
            className={clsx(
              "flex items-center gap-2 px-2 py-1 rounded-lg transition-colors",
              isDarkMode ? "hover:bg-white/10" : "hover:bg-slate-100"
            )}
          >
            <User
              size={20}
              className={isDarkMode ? "text-indigo-300" : "text-indigo-600"}
            />
            <span className="text-sm font-medium">
              {currentUser ? `${currentUser.firstName} (${currentUser.role})` : 'Loading...'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard/messages')}
            className={clsx(
              "flex items-center gap-1 transition-colors",
              isDarkMode ? "hover:text-gray-300" : "hover:text-indigo-600"
            )}
          >
            <MessageSquare size={20} />
            <span className="text-sm">Messages</span>
          </button>
           <button onClick={handleLogout} className="flex items-center gap-1 hover:text-red-400">
             <span className="text-sm">Logout</span>
           </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside 
            className={clsx(
                "border-r overflow-y-auto flex-shrink-0 pb-10 transition-all duration-300 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] z-10 relative",
                isCollapsed ? "w-20" : "w-72",
                isDarkMode ? "border-white/10" : "border-slate-200"
            )}
            style={{ background: topBottomBackground }}
        >
          
          <div className={clsx("px-4 pt-5 pb-3 flex items-center relative z-10", isCollapsed ? "justify-center" : "justify-between")}>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className={clsx(
                  "text-xs font-bold uppercase tracking-wider",
                  isDarkMode ? "text-indigo-100/60" : "text-slate-500"
                )}>
                  Menu
                </span>
              </div>
            )}
             <button 
                onClick={() => setIsCollapsed(!isCollapsed)} 
                className={clsx(
                  "p-1.5 rounded-lg transition-colors",
                  isDarkMode ? "text-indigo-200 hover:bg-white/10" : "text-slate-400 hover:bg-slate-100"
                )}
             >
                {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
             </button>
          </div>
          <div className={clsx("px-4 pb-2 relative z-10", isCollapsed ? "flex flex-col items-center gap-2" : "flex items-center justify-between")} />
          <div className="flex flex-col px-3 relative z-10 gap-1 mt-1">
             {MENU_ITEMS.map((item) => {
               if (item.allowedRoles && (!currentUser || !item.allowedRoles.includes(currentUser.role))) return null;
               if (item.excludedRoles && currentUser && item.excludedRoles.includes(currentUser.role)) return null;
               if (item.departmentKey) {
                 const role = currentUser?.role;
                 const isGlobal = role === 'admin' || role === 'school_admin';
                 const hasDept = departmentAccess.includes(item.departmentKey);
                 if (!isGlobal && !hasDept) return null;
               }

               return (
                 <SidebarItem 
                   key={item.to}
                   icon={item.icon} 
                   label={item.label} 
                   to={item.to} 
                   active={location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to))}
                   onClick={() => scrollToTopAll('auto')}
                   isCollapsed={isCollapsed}
                   theme={item.theme}
                   isDarkMode={isDarkMode}
                 />
               );
             })}
          </div>
        </aside>

        {/* Main Content */}
        <main 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth bg-slate-50/50 dark:bg-slate-950"
          onScroll={handleScroll}
        >
           <div className="min-h-full flex flex-col">
             <div className="flex-1 p-6">
               <Outlet
                 context={{
                   currentUser,
                   currency,
                   currencyConfig,
                   formatCurrencyFromBase,
                   convertAmountToBase,
                 }}
               />
             </div>
             <footer
               className={clsx(
                 "w-full py-4 px-6 text-sm border-t mt-auto transition-colors",
                 isDarkMode 
                   ? "border-slate-900/40 text-slate-200" 
                   : "border-slate-200 text-slate-600"
               )}
               style={{ background: topBottomBackground }}
             >
               <div className="max-w-6xl mx-auto flex flex-col gap-3">
                 <p className="text-xs sm:text-center">
                   <a
                     href="https://geenie.org"
                     target="_blank"
                     rel="noreferrer"
                     className="font-semibold hover:underline"
                   >
                     © 2025 doonITes ERP.
                   </a>{' '}
                   <span className="font-semibold" style={{ color: 'var(--ui-accent)' }}>
                     Made with ❤️ for Education.
                   </span>
                 </p>
               </div>
             </footer>
           </div>
        </main>

        {/* Scroll to Top Button */}
        <button
          onClick={scrollToTop}
          className={clsx(
            "fixed bottom-20 right-8 bg-indigo-600 text-white p-3 rounded-full shadow-lg transition-all duration-300 z-50 hover:bg-indigo-700 hover:scale-110",
            showScrollTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
          )}
          aria-label="Scroll to top"
        >
          <ArrowUp size={24} />
        </button>
      </div>
      

    </div>
  );
};

export default DashboardLayout;
