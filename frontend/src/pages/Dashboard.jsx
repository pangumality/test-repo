import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { 
  Users, 
  GraduationCap, 
  Home, 
  CreditCard,
  BarChart2,
  Building2,
  DollarSign,
  MessageSquare,
  Activity
} from 'lucide-react';
import ParentDashboard from './ParentDashboard';
import api from '../utils/api';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const StatCard = ({ icon: Icon, title, count, colorFrom, colorTo, iconColor, buttonLabel, link }) => {
  const CardContent = () => (
    <>
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colorFrom} ${colorTo} opacity-10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110`} />
      
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colorFrom} ${colorTo} shadow-lg ${iconColor} text-white transform group-hover:scale-110 transition-transform duration-300`}>
          <Icon size={24} />
        </div>
        {buttonLabel && (
          <span className={`text-xs font-bold px-3 py-1 rounded-full bg-slate-50 group-hover:bg-white group-hover:shadow-sm transition-all border border-slate-100 bg-gradient-to-r ${colorFrom} ${colorTo} bg-clip-text text-transparent`}>
            {buttonLabel}
          </span>
        )}
      </div>
      
      <div>
        <h3 className={`bg-gradient-to-r ${colorFrom} ${colorTo} bg-clip-text text-transparent text-sm font-medium uppercase tracking-wider mb-1`}>{title}</h3>
        <span className={`bg-gradient-to-r ${colorFrom} ${colorTo} bg-clip-text text-transparent text-4xl font-black tracking-tight`}>{count}</span>
      </div>
    </>
  );

  if (link) {
    return (
      <Link to={link} className="group relative bg-white rounded-2xl p-6 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden block">
        <CardContent />
      </Link>
    );
  }

  return (
    <div className="group relative bg-white rounded-2xl p-6 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      <CardContent />
    </div>
  );

  return link ? <Link to={link}>{CardContent}</Link> : CardContent;
};

const Dashboard = () => {
  const { currentUser } = useOutletContext() || {};
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    classes: 0,
    parents: 0,
    // Super Admin stats
    schools: 0,
    users: 0,
    revenue: 0,
    messages: 0
  });

  useEffect(() => {
    if (currentUser?.role === 'admin' || currentUser?.role === 'super_admin') {
      fetchStats();
    }
  }, [currentUser]);

  const fetchStats = async () => {
    try {
      const response = await api.get('/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  if (currentUser?.role === 'parent') {
    return <ParentDashboard />;
  }

  // Chart Data Logic
  const chartData = currentUser?.role === 'admin' ? {
    labels: ['Schools', 'Users', 'Messages (x10)', 'Revenue (x100)'],
    datasets: [
      {
        label: 'System Overview',
        data: [
            stats.schools, 
            stats.users, 
            Math.round(stats.messages / 10), 
            Math.round(stats.revenue / 100)
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)', // Blue
          'rgba(244, 63, 94, 0.8)',  // Rose
          'rgba(16, 185, 129, 0.8)', // Emerald
          'rgba(139, 92, 246, 0.8)'  // Violet
        ],
        hoverBackgroundColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(244, 63, 94, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(139, 92, 246, 1)'
        ],
        borderRadius: 8,
        borderSkipped: false,
        barPercentage: 0.6,
        categoryPercentage: 0.8
      }
    ]
  } : {
    labels: ['Students', 'Teachers', 'Classes', 'Parents'],
    datasets: [
      {
        label: 'School Statistics',
        data: [stats.students, stats.teachers, stats.classes, stats.parents],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)', // Blue
          'rgba(244, 63, 94, 0.8)',  // Rose
          'rgba(16, 185, 129, 0.8)', // Emerald
          'rgba(139, 92, 246, 0.8)'  // Violet
        ],
        hoverBackgroundColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(244, 63, 94, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(139, 92, 246, 1)'
        ],
        borderRadius: 8,
        borderSkipped: false,
        barPercentage: 0.6,
        categoryPercentage: 0.8
      }
    ]
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
           <h2 className="text-2xl font-black text-slate-800 tracking-tight">Dashboard Overview</h2>
           <p className="text-slate-500 mt-1">Welcome back, {currentUser?.firstName || 'Guest'}! Here's what's happening today.</p>
        </div>
        <div className="text-sm font-medium text-slate-500 bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200">
           {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>
      
      {currentUser?.role === 'admin' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            icon={Building2} 
            title="Total Schools" 
            count={stats.schools} 
            colorFrom="from-blue-500"
            colorTo="to-cyan-400"
            iconColor="shadow-blue-500/40"
            buttonLabel="Manage"
            link="/schools"
          />
          <StatCard 
            icon={Users} 
            title="Total Users" 
            count={stats.users} 
            colorFrom="from-rose-500"
            colorTo="to-pink-500"
            iconColor="shadow-rose-500/40"
            buttonLabel="View All"
            // link="/users" // Assuming a users page exists or we just show count
          />
          <StatCard 
            icon={DollarSign} 
            title="Total Revenue" 
            count={`$${stats.revenue.toLocaleString()}`}
            colorFrom="from-emerald-500"
            colorTo="to-teal-400"
            iconColor="shadow-emerald-500/40"
            buttonLabel="Finance"
            link="/finance"
          />
          <StatCard 
            icon={MessageSquare} 
            title="Total Messages" 
            count={stats.messages} 
            colorFrom="from-violet-500"
            colorTo="to-purple-500"
            iconColor="shadow-violet-500/40"
            buttonLabel="View Logs"
            // link="/logs"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            icon={GraduationCap} 
            title="Total Students" 
            count={stats.students} 
            colorFrom="from-blue-500"
            colorTo="to-cyan-400"
            iconColor="shadow-blue-500/40"
            buttonLabel="View All"
            link="/students"
        />
          {(!currentUser || currentUser.role !== 'teacher') && (
            <StatCard 
              icon={Users} 
              title="Total Teachers" 
              count={stats.teachers} 
              colorFrom="from-rose-500"
              colorTo="to-pink-500"
              iconColor="shadow-rose-500/40"
              buttonLabel="View All"
              link="/teachers"
          />
          )}
          <StatCard 
            icon={Home} 
            title="Total Classes" 
            count={stats.classes} 
            colorFrom="from-emerald-500"
            colorTo="to-teal-400"
            iconColor="shadow-emerald-500/40"
            buttonLabel={currentUser?.role === 'student' ? 'My Subjects' : 'View All'} 
            link={currentUser?.role === 'student' ? '/subjects' : '/classes'}
        />
          {(!currentUser || currentUser.role !== 'teacher') && (
            <StatCard 
              icon={CreditCard} 
              title="Total Parents" 
              count={stats.parents} 
              colorFrom="from-violet-500"
              colorTo="to-purple-500"
              iconColor="shadow-violet-500/40"
              buttonLabel="Finance"
              link="/finance"
          />
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {currentUser?.role === 'admin' && (
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <BarChart2 size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-700">Statistics Overview</h3>
              </div>
            </div>
            <div className="h-80">
              <Bar 
                data={chartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      backgroundColor: '#1e293b',
                      padding: 12,
                      cornerRadius: 8,
                      titleFont: { size: 14, weight: 'bold' },
                      bodyFont: { size: 13 },
                      displayColors: false,
                    }
                  },
                  scales: {
                    y: {
                      grid: { color: '#f1f5f9' },
                      border: { display: false },
                      ticks: { color: '#64748b', font: { size: 12 } }
                    },
                    x: {
                      grid: { display: false },
                      border: { display: false },
                      ticks: { color: '#64748b', font: { weight: 'bold' } }
                    }
                  }
                }} 
              />
            </div>
          </div>
        )}

        <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-6 ${!(currentUser?.role === 'admin' || currentUser?.role === 'super_admin') ? 'lg:col-span-3' : ''}`}>
          <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📅</span>
              <h3 className="font-bold text-slate-700">Events Calendar</h3>
            </div>
            <button className="text-indigo-500 text-sm font-medium hover:text-indigo-700 transition-colors">View All</button>
          </div>
          
          <div className="text-center mb-6">
             <h3 className="text-xl font-bold text-slate-800">December 2025</h3>
             <p className="text-sm text-slate-400">School Activities & Holidays</p>
          </div>

          {/* Simple Calendar Grid Mockup */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
               {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                 <div key={day} className="py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">{day}</div>
               ))}
            </div>
            <div className="grid grid-cols-7 bg-white">
               {/* Padding days */}
               {[1, 2, 3, 4, 5, 6].map(d => (
                 <div key={`pad-${d}`} className="h-20 border-r border-b border-slate-100 last:border-r-0"></div>
               ))}
               
               {/* Days 1-31 */}
               {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                 <div key={day} className={`h-20 border-r border-b border-slate-100 last:border-r-0 p-1 relative hover:bg-slate-50 transition-colors group`}>
                   <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${day === 30 ? 'bg-indigo-500 text-white shadow-md shadow-indigo-200' : 'text-slate-600'}`}>
                     {day}
                   </span>
                   {day === 30 && (
                     <div className="mt-1">
                       <div className="h-1.5 w-full bg-rose-400 rounded-full mb-0.5"></div>
                       <div className="h-1.5 w-2/3 bg-emerald-400 rounded-full"></div>
                     </div>
                   )}
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
