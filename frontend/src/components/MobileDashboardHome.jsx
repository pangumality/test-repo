import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  MessageSquare, 
  Users, 
  GraduationCap, 
  Home, 
  BookOpen, 
  CreditCard, 
  Library, 
  Bus,
  Radio,
  Trophy,
  Package,
  Activity,
  Image as ImageIcon,
  Newspaper
} from 'lucide-react';
import api from '../utils/api';

const MobileDashboardHome = ({ currentUser, currencyConfig, formatCurrencyFromBase }) => {
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    classes: 0,
    parents: 0,
    revenue: 0,
  });

  const formatCurrency = (amount) => {
    if (typeof formatCurrencyFromBase === 'function') {
      return formatCurrencyFromBase(amount);
    }
    const numeric = Number(amount || 0);
    const symbol = currencyConfig?.symbol || 'ZMW';
    return `${symbol} ${numeric.toLocaleString()}`;
  };

  useEffect(() => {
    if (
      currentUser &&
      (currentUser.role === 'admin' ||
        currentUser.role === 'super_admin' ||
        currentUser.role === 'school_admin' ||
        currentUser.role === 'teacher')
    ) {
      const load = async () => {
        try {
          const res = await api.get('/stats');
          setStats(prev => ({ ...prev, ...res.data }));
        } catch {
        }
      };
      load();
    }
  }, [currentUser]);

  const menuItems = [
    { icon: CreditCard, label: 'Pay Fees', to: '/dashboard/finance', excludedRoles: ['teacher'] },
    { icon: Calendar, label: 'Attendance', to: '/dashboard/attendance' },
    { icon: BookOpen, label: 'Subjects', to: '/dashboard/subjects' },
    { icon: BookOpen, label: 'Learn @ Home', to: '/dashboard/library', excludedRoles: ['teacher'] }, // Using Library as placeholder
    { icon: Users, label: 'Teachers', to: '/dashboard/teachers', excludedRoles: ['teacher'] },
    { icon: Activity, label: 'Time-Table', to: '/dashboard/classes' }, // Placeholder
    { icon: MessageSquare, label: 'Messages', to: '/dashboard/messages' },
    { icon: BookOpen, label: 'Study Material', to: '/dashboard/library', excludedRoles: ['teacher'] },
    { icon: Radio, label: 'E-Learning', to: '/dashboard/radio' },
    { icon: Calendar, label: 'Datesheet', to: '/dashboard/exams' },
    { icon: Calendar, label: 'Activity Calendar', to: '/dashboard' }, // Placeholder
    { icon: Newspaper, label: 'Newsletter', to: '/dashboard/newsletters' },
    { icon: Trophy, label: 'Events', to: '/dashboard/sports', excludedRoles: ['teacher'] },
    { icon: ImageIcon, label: 'Gallery', to: '/dashboard/gallery' },
    { icon: GraduationCap, label: 'Class Remarks', to: '/dashboard/students' },
    { icon: Bus, label: 'Transport', to: '/dashboard/transport', excludedRoles: ['teacher'] },
    { icon: Users, label: 'Group Studies', to: '/dashboard/group-studies' },
    { icon: Home, label: 'Hostel', to: '/dashboard/hostel', excludedRoles: ['teacher'] },
  ];

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-140px)] pb-24">
      {currentUser?.role === 'school_admin' && (
        <div className="p-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-emerald-500 text-white p-4 flex flex-col justify-between">
            <div className="text-xs font-semibold uppercase">Students</div>
            <div className="text-2xl font-bold mt-2">{stats.students}</div>
          </div>
          <div className="rounded-xl bg-sky-500 text-white p-4 flex flex-col justify-between">
            <div className="text-xs font-semibold uppercase">Teachers</div>
            <div className="text-2xl font-bold mt-2">{stats.teachers}</div>
          </div>
          <div className="rounded-xl bg-indigo-500 text-white p-4 flex flex-col justify-between">
            <div className="text-xs font-semibold uppercase">Classes</div>
            <div className="text-2xl font-bold mt-2">{stats.classes}</div>
          </div>
          <div className="rounded-xl bg-amber-500 text-white p-4 flex flex-col justify-between">
            <div className="text-xs font-semibold uppercase">Revenue</div>
            <div className="text-xl font-bold mt-2">
              {formatCurrency(stats.revenue || 0)}
            </div>
          </div>
        </div>
      )}

      <div className="px-4 pt-2 grid grid-cols-3 gap-3">
        {menuItems.map((item, index) => {
          if (item.excludedRoles && currentUser && item.excludedRoles.includes(currentUser.role)) return null;
          
          return (
            <Link 
              key={index} 
              to={item.to}
              className="flex flex-col items-center justify-center bg-white p-3 rounded-2xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-slate-100 h-28 active:scale-95 transition-all duration-200 group relative overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-pink-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              
              <div className="p-2.5 rounded-xl bg-slate-50 text-slate-600 mb-2 group-hover:bg-indigo-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-indigo-500/30 transition-all duration-300 relative z-10">
                <item.icon size={24} strokeWidth={2} />
              </div>
              
              <span className="text-[11px] font-bold text-center text-slate-600 leading-tight group-hover:text-indigo-600 transition-colors relative z-10">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default MobileDashboardHome;
