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
  Bot
} from 'lucide-react';
import clsx from 'clsx';
import { seedAll } from '../utils/seed';
import MobileDashboardHome from '../components/MobileDashboardHome';
import api from '../utils/api';

const SidebarItem = ({ icon: Icon, label, to, active, onClick, isCollapsed, colorTheme }) => {
  const themeVariant = colorTheme || 'purple';

  const activeClasses =
    themeVariant === 'purple'
      ? 'bg-purple-500/90 text-white shadow-lg shadow-purple-900/40 scale-[1.02]'
      : themeVariant === 'blue'
      ? 'bg-blue-500/90 text-white shadow-lg shadow-blue-900/40 scale-[1.02]'
      : 'bg-slate-100 text-slate-900 shadow-sm scale-[1.02]';

  const inactiveClasses =
    themeVariant === 'light'
      ? 'bg-transparent text-slate-600 hover:bg-slate-50 hover:shadow-md hover:shadow-slate-200/60 hover:text-slate-900 hover:translate-x-1'
      : 'bg-transparent text-white/80 hover:bg-white/10 hover:shadow-lg hover:shadow-black/20 hover:text-white hover:translate-x-1';

  const inactiveIconClasses =
    themeVariant === 'light'
      ? 'bg-slate-100 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-900'
      : 'bg-white/10 text-white/80 group-hover:bg-white/20 group-hover:text-white';

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
            : inactiveIconClasses
        )}
      >
        <Icon size={18} />
      </div>
      {!isCollapsed && <span className="font-medium whitespace-nowrap overflow-hidden tracking-wide">{label}</span>}
      {!isCollapsed && !active && (
         <ChevronRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-all duration-300 text-brand-300 group-hover:translate-x-1" />
      )}
    </Link>
  );
};

const MENU_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/' },
  { icon: Calendar, label: 'Attendance', to: '/attendance', allowedRoles: ['student','teacher','admin','school_admin'] },
  { icon: MessageSquare, label: 'Messages', to: '/messages', allowedRoles: ['student','teacher','admin','school_admin','parent'] },
  { icon: Bell, label: 'Notice Board', to: '/notices', allowedRoles: ['student','teacher','admin','school_admin','parent'] },
  { icon: Newspaper, label: 'Newsletters', to: '/newsletters', allowedRoles: ['student','teacher','admin','school_admin','parent'] },
  { icon: ImageIcon, label: 'Gallery', to: '/gallery', allowedRoles: ['student','teacher','admin','school_admin','parent'] },
  { icon: FileCheck, label: 'Leaves', to: '/leaves', allowedRoles: ['student','parent','admin','school_admin','teacher'] },
  { icon: Clock, label: 'Time Table', to: '/timetable', allowedRoles: ['student','teacher','admin','school_admin','parent'] },
  { icon: Award, label: 'Certificates', to: '/certificates', allowedRoles: ['student','parent','admin','school_admin'] },
  { icon: Users, label: 'Teachers', to: '/teachers', excludedRoles: ['student','teacher','parent'] },
  { icon: GraduationCap, label: 'Students', to: '/students', allowedRoles: ['admin','school_admin'] },
  { icon: Home, label: 'Classes', to: '/classes', allowedRoles: ['teacher','admin','school_admin'] },
  { icon: SchoolIcon, label: 'Schools', to: '/schools', allowedRoles: ['admin'] },
  { icon: BookOpen, label: 'Exams', to: '/exams', excludedRoles: ['student','parent'] },
  { icon: FileText, label: 'My Exams', to: '/student/exams', allowedRoles: ['student'] },
  { icon: CreditCard, label: 'Finance', to: '/finance', excludedRoles: ['student','teacher','parent'] },
  { icon: Library, label: 'Library', to: '/library', allowedRoles: ['student','admin','school_admin'] },
  { icon: Home, label: 'Hostel', to: '/hostel', allowedRoles: ['student','admin','school_admin'] },
  { icon: Bus, label: 'Transport', to: '/transport', excludedRoles: ['student','teacher','parent'] },
  { icon: Radio, label: 'E-Learning', to: '/e-learning', allowedRoles: ['student','teacher','admin','school_admin'] },
  { icon: BookOpen, label: 'Subjects', to: '/subjects', allowedRoles: ['student','teacher','admin','school_admin'] },
  { icon: Trophy, label: 'Sports', to: '/sports', excludedRoles: ['student','teacher','parent'] },
  { icon: Users, label: 'Group Studies', to: '/group-studies', allowedRoles: ['student','teacher','admin','school_admin'] },
  { icon: Package, label: 'Inventory', to: '/inventory', excludedRoles: ['student','teacher','parent'] },
];

const DashboardLayout = ({ theme = 'light', setTheme, uiColor = 'purple', setUiColor }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // For mobile
  const [currentUser, setCurrentUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);
  const isMobile = window.innerWidth < 768;
  const logoUrl = import.meta.env.VITE_LOGO_URL || '/logo.jpg';

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
      navigate('/messages');
    } else if (notification.activityType === 'LEAVE_REQUEST') {
      navigate('/leaves');
    } else if (notification.activityType === 'HOMEWORK') {
      navigate('/e-learning');
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
      <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden">
        {/* Mobile Header - Curved */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white pt-6 pb-16 px-6 rounded-b-[40px] shadow-xl relative z-10 transition-all duration-300">
          <div className="absolute inset-0 bg-white/10 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/20 to-transparent"></div>
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="flex items-center gap-3">
               <button onClick={() => setMobileMenuOpen(true)}>
                 <Menu size={24} />
               </button>
               {currentUser?.school?.logo ? (
                 <img src={currentUser.school.logo} alt="school logo" className="w-10 h-10 rounded-full object-cover border border-white/30 bg-white" />
               ) : logoUrl ? (
                 <img src={logoUrl} alt="logo" className="w-8 h-8 rounded-full object-cover border border-white/30" />
               ) : null}
               <span className="font-medium text-lg truncate max-w-[200px]">
                 {currentUser?.school?.name || 'doonITes ERP'}
               </span>
            </div>
            {/* Optional: Add notification or user icon here if needed */}
          </div>
          
          <div className="text-center">
            <h1 className="text-2xl font-light mb-1">
              Hi! {currentUser ? currentUser.firstName : 'User'}
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
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            
            {/* Drawer Content */}
            <div className="relative bg-white w-[80%] max-w-sm h-full shadow-2xl flex flex-col animate-slide-in">
              <div className="p-4 bg-[#0f172a] text-white flex justify-between items-center">
                <span className="font-bold text-lg">Menu</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 hover:bg-white/10 rounded">
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                 {MENU_ITEMS.map((item) => (
                   <SidebarItem 
                     key={item.to}
                     icon={item.icon} 
                     label={item.label} 
                     to={item.to} 
                     active={location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to))}
                     onClick={() => {
                       setMobileMenuOpen(false);
                       scrollToTopAll('auto');
                     }}
                   />
                 ))}
              </div>

              <div className="p-4 border-t bg-gray-50">
                <Link 
                  to="/profile" 
                  onClick={() => {
                    setMobileMenuOpen(false);
                    scrollToTopAll('auto');
                  }}
                  className="flex items-center gap-3 mb-4 hover:bg-gray-100 p-2 rounded-lg -mx-2 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
                    {currentUser?.firstName?.[0] || 'U'}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{currentUser?.firstName} {currentUser?.lastName}</p>
                    <p className="text-xs text-gray-500 capitalize">{currentUser?.role}</p>
                  </div>
                </Link>
                <button className="flex items-center gap-2 text-red-500 w-full p-2 hover:bg-red-50 rounded">
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Content */}
        <main ref={scrollContainerRef} className="flex-1 -mt-6 z-20 px-2 overflow-y-auto pb-20">
          {location.pathname === '/' ? (
            <MobileDashboardHome />
          ) : (
             <div className="bg-white rounded-t-3xl min-h-full p-4 shadow-inner">
               <Outlet />
             </div>
          )}
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#0f172a] text-white h-16 flex items-center justify-between px-8 shadow-lg z-50">
          <Link to="/" className="flex flex-col items-center gap-1 opacity-90 hover:opacity-100">
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

  const sidebarTheme = uiColor;

  const sidebarBgClass =
    sidebarTheme === 'purple'
      ? 'bg-gradient-to-b from-purple-600 via-purple-600 to-indigo-600 text-white'
      : sidebarTheme === 'blue'
      ? 'bg-gradient-to-b from-blue-600 via-blue-600 to-sky-500 text-white'
      : 'bg-white text-slate-800';

  const sidebarBorderClass =
    sidebarTheme === 'white' ? 'border-r border-slate-100/80' : 'border-none';

  const sidebarHeaderTitleClass =
    sidebarTheme === 'white' ? 'text-slate-900' : 'text-white';

  const sidebarHeaderSubtitleClass =
    sidebarTheme === 'white' ? 'text-slate-400' : 'text-white/60';

  const sidebarToggleButtonClass =
    sidebarTheme === 'white'
      ? 'p-1.5 rounded-lg transition-colors text-slate-400 hover:bg-slate-100 hover:text-slate-700'
      : 'p-1.5 rounded-lg transition-colors text-white/70 hover:bg-white/15 hover:text-white';

  const sidebarBlobClass =
    sidebarTheme === 'white'
      ? 'bg-gradient-to-b from-slate-50 to-transparent'
      : 'bg-gradient-to-b from-white/15 to-transparent';

  const sidebarItemThemeVariant = sidebarTheme === 'white' ? 'light' : sidebarTheme;

  const appBgClass = sidebarTheme === 'white' ? 'bg-slate-100' : 'bg-slate-50';

  const topBottomBackground = 'linear-gradient(90deg, #05081a 0%, #0b1029 100%)';

  const mainBackground = 'linear-gradient(180deg, var(--ui-bg-start) 0%, var(--ui-bg-mid) 40%, var(--ui-bg-end) 100%)';

  return (
    <div className={clsx('min-h-screen flex flex-col font-sans', appBgClass)}>
      {/* Top Navigation Bar */}
      <header
        className="h-16 flex items-center justify-between px-6 shadow-md z-20 sticky top-0 text-white"
        style={{ backgroundImage: topBottomBackground }}
      >
        <div className="flex items-center gap-4">
           {currentUser?.school?.logo ? (
             <img src={currentUser.school.logo} alt="school logo" className="w-10 h-10 rounded-full object-cover shadow-lg shadow-indigo-500/30 bg-white" />
           ) : logoUrl ? (
             <img src={logoUrl} alt="logo" className="w-8 h-8 rounded-full object-cover shadow-lg shadow-indigo-500/30" />
           ) : (
             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
               <SchoolIcon size={18} className="text-white" />
             </div>
           )}
           <div className="flex flex-col">
             {currentUser?.school?.name ? (
               <>
                 <h1 className="text-lg font-bold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-indigo-400 leading-tight">
                   {currentUser.school.name}
                 </h1>
                 <span className="text-[10px] text-indigo-300 font-medium tracking-wider">
                   POWERED BY doonITes ERP
                 </span>
               </>
             ) : (
               <h1 className="text-lg font-bold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-indigo-400">
                 doonITes weBBed serVIces ERP
               </h1>
             )}
           </div>
        </div>
        <div className="flex items-center gap-6 relative">
          <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 border border-white/20">
            <button
              type="button"
              onClick={() => setUiColor && setUiColor('purple')}
              className={clsx(
                "w-4 h-4 rounded-full bg-purple-500 border-2 transition-all duration-200",
                sidebarTheme === 'purple' ? "border-white" : "border-white/40"
              )}
              aria-label="Purple theme"
            />
            <button
              type="button"
              onClick={() => setUiColor && setUiColor('blue')}
              className={clsx(
                "w-4 h-4 rounded-full bg-blue-500 border-2 transition-all duration-200",
                sidebarTheme === 'blue' ? "border-white" : "border-white/40"
              )}
              aria-label="Blue theme"
            />
            <button
              type="button"
              onClick={() => setUiColor && setUiColor('white')}
              className={clsx(
                "w-4 h-4 rounded-full bg-white border-2 transition-all duration-200",
                sidebarTheme === 'white' ? "border-slate-200" : "border-slate-400/60"
              )}
              aria-label="White theme"
            />
          </div>
          <button
            type="button"
            onClick={() => setTheme && setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center"
          >
            {theme === 'dark' ? '🌙' : '☀️'}
          </button>
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
               <div className="absolute right-0 mt-2 w-80 bg-white text-gray-800 rounded-md shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
                 <div className="p-3 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
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

           <Link to="/profile" className="flex items-center gap-2 hover:bg-white/10 px-2 py-1 rounded-lg transition-colors">
             <User
               size={20}
               className={sidebarTheme === 'white'
                 ? 'text-slate-500'
                 : sidebarTheme === 'blue'
                 ? 'text-sky-400'
                 : 'text-purple-400'}
             />
             <span className="text-sm font-medium">
               {currentUser ? `${currentUser.firstName} (${currentUser.role})` : 'Loading...'}
             </span>
           </Link>
           <Link to="/messages" className="flex items-center gap-1 hover:text-gray-300">
             <MessageSquare size={20} />
             <span className="text-sm">Messages</span>
           </Link>
           <button onClick={handleLogout} className="flex items-center gap-1 hover:text-red-400">
             <span className="text-sm">Logout</span>
           </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className={clsx(
            "overflow-y-auto flex-shrink-0 pb-10 transition-all duration-300 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] z-10 relative",
            sidebarBgClass,
            sidebarBorderClass,
            isCollapsed ? "w-20" : "w-72"
        )}>
          <div className={clsx("absolute top-0 left-0 w-full h-40 pointer-events-none", sidebarBlobClass)} />
          
          <div className={clsx("px-4 pt-5 pb-3 flex items-center relative z-10", isCollapsed ? "justify-center" : "justify-between")}>
             {!isCollapsed && (
               <div className="flex flex-col">
                 <span className={clsx("text-sm font-semibold tracking-wide", sidebarHeaderTitleClass)}>
                   doonITes ERP
                 </span>
                 <span className={clsx("text-[11px] mt-1 tracking-wide uppercase font-medium", sidebarHeaderSubtitleClass)}>
                   Menu
                 </span>
               </div>
             )}
             <button 
                onClick={() => setIsCollapsed(!isCollapsed)} 
                className={sidebarToggleButtonClass}
             >
                {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
             </button>
          </div>
          <div className="px-4 pb-2 relative z-10" />
          <div className="flex flex-col px-3 relative z-10 gap-1 mt-1">
             {MENU_ITEMS.map((item) => {
               if (item.allowedRoles && (!currentUser || !item.allowedRoles.includes(currentUser.role))) return null;
               if (item.excludedRoles && currentUser && item.excludedRoles.includes(currentUser.role)) return null;

               return (
                 <SidebarItem 
                   key={item.to}
                   icon={item.icon} 
                   label={item.label} 
                   to={item.to} 
                   active={location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to))}
                   onClick={() => scrollToTopAll('auto')}
                   isCollapsed={isCollapsed}
                   colorTheme={sidebarItemThemeVariant}
                 />
               );
             })}
          </div>
        </aside>

        {/* Main Content */}
        <main 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-6 scroll-smooth"
          onScroll={handleScroll}
          style={{ backgroundImage: mainBackground }}
        >
           <Outlet context={{ currentUser, uiColor: sidebarTheme }} />
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
      
      <footer
        className="w-full py-4 px-6 text-center text-sm border-t border-slate-900/40"
        style={{ backgroundImage: topBottomBackground }}
      >
        <p className="text-slate-200">
          © 2025 doonITes ERP.{' '}
          <span className="font-semibold" style={{ color: 'var(--ui-accent)' }}>
            Made with ❤️ for Education.
          </span>
        </p>
      </footer>
    </div>
  );
};

export default DashboardLayout;
