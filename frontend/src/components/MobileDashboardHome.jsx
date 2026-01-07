import React from 'react';
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

const MobileDashboardHome = ({ currentUser }) => {
  const menuItems = [
    { icon: CreditCard, label: 'Pay Fees', to: '/finance', excludedRoles: ['teacher'] },
    { icon: Calendar, label: 'Attendance', to: '/attendance' },
    { icon: BookOpen, label: 'Subjects', to: '/subjects' },
    { icon: BookOpen, label: 'Learn @ Home', to: '/library', excludedRoles: ['teacher'] }, // Using Library as placeholder
    { icon: Users, label: 'Teachers', to: '/teachers', excludedRoles: ['teacher'] },
    { icon: Activity, label: 'Time-Table', to: '/classes' }, // Placeholder
    { icon: MessageSquare, label: 'Messages', to: '/messages' },
    { icon: BookOpen, label: 'Study Material', to: '/library', excludedRoles: ['teacher'] },
    { icon: Radio, label: 'E-Learning', to: '/radio' },
    { icon: Calendar, label: 'Datesheet', to: '/exams' },
    { icon: Calendar, label: 'Activity Calendar', to: '/dashboard' }, // Placeholder
    { icon: Newspaper, label: 'Newsletter', to: '/newsletters' },
    { icon: Trophy, label: 'Events', to: '/sports', excludedRoles: ['teacher'] },
    { icon: ImageIcon, label: 'Gallery', to: '/gallery' },
    { icon: GraduationCap, label: 'Class Remarks', to: '/students' },
    { icon: Bus, label: 'Transport', to: '/transport', excludedRoles: ['teacher'] },
    { icon: Users, label: 'Group Studies', to: '/group-studies' },
    { icon: Home, label: 'Hostel', to: '/hostel', excludedRoles: ['teacher'] },
  ];

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-140px)] pb-24">
      <div className="p-4 grid grid-cols-3 gap-3">
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
