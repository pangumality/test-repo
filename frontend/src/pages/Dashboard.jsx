import React, { useEffect, useMemo, useState } from 'react';
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
  Activity,
  BookOpen,
  Radio,
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
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const StatCard = ({
  icon: Icon,
  title,
  count,
  colorFrom,
  colorTo,
  iconColor,
  buttonLabel,
  link,
}) => {
  const isClickable = !!link;

  const content = (
    <>
      <div
        className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colorFrom} ${colorTo} opacity-40 rounded-bl-[100px] -mr-8 -mt-8 transition-all duration-500 group-hover:scale-110 group-hover:opacity-60`}
      />

      <div className="flex items-start justify-between mb-4 relative z-10">
        <div
          className={`p-3.5 rounded-2xl bg-gradient-to-br ${colorFrom} ${colorTo} shadow-lg ${iconColor} text-white transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}
        >
          <Icon size={24} strokeWidth={2.5} />
        </div>
        {buttonLabel && (
          <span
            className={`text-[10px] font-bold px-3 py-1 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm group-hover:bg-white dark:group-hover:bg-slate-700 shadow-sm transition-all border border-slate-100/50 dark:border-slate-700/50 bg-gradient-to-r ${colorFrom} ${colorTo} bg-clip-text text-transparent uppercase tracking-wider`}
          >
            {buttonLabel}
          </span>
        )}
      </div>

      <div className="relative z-10">
        <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 opacity-80">
          {title}
        </h3>
        <span
          className={`bg-gradient-to-r ${colorFrom} ${colorTo} bg-clip-text text-transparent text-4xl font-display font-bold tracking-tight`}
        >
          {count}
        </span>
      </div>
    </>
  );

  return isClickable ? (
    <Link
      to={link}
      className="group relative bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-soft border border-slate-100 dark:border-slate-800 hover:shadow-2xl hover:shadow-brand-500/10 transition-all duration-300 hover:-translate-y-1 overflow-hidden block cursor-pointer min-h-[210px]"
    >
      {content}
    </Link>
  ) : (
    <div className="group relative bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-soft border border-slate-100 dark:border-slate-800 overflow-hidden min-h-[210px]">
      {content}
    </div>
  );
};

const Dashboard = () => {
  const { currentUser, formatCurrencyFromBase } = useOutletContext() || {};

  const formatCurrency = (amount) => {
    if (typeof formatCurrencyFromBase === 'function') {
      return formatCurrencyFromBase(amount);
    }
    const numeric = Number(amount || 0);
    return `ZMW ${numeric.toLocaleString()}`;
  };

  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    classes: 0,
    parents: 0,
    schools: 0,
    users: 0,
    revenue: 0,
    messages: 0,
  });

  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [activeCalendarDay, setActiveCalendarDay] = useState(null);
  const [showDayEventsModal, setShowDayEventsModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [newCalendarEvent, setNewCalendarEvent] = useState({
    title: '',
    description: '',
    date: '',
  });

  useEffect(() => {
    if (
      currentUser?.role === 'admin' ||
      currentUser?.role === 'super_admin' ||
      currentUser?.role === 'school_admin' ||
      currentUser?.role === 'teacher'
    ) {
      const load = async () => {
        try {
          const response = await api.get('/stats');
          setStats(response.data);
        } catch (error) {
          console.error('Failed to fetch stats:', error);
        }
      };
      load();
    }
  }, [currentUser]);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/calendar');
        setCalendarEvents(response.data || []);
      } catch (error) {
        console.error('Failed to fetch calendar events:', error);
      }
    };
    load();
  }, []);

  const calendarYear = calendarMonth.getFullYear();
  const calendarMonthIndex = calendarMonth.getMonth();
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonthIndex = today.getMonth();
  const todayDate = today.getDate();

  const monthStart = useMemo(
    () => new Date(calendarYear, calendarMonthIndex, 1),
    [calendarYear, calendarMonthIndex],
  );

  const firstWeekday = monthStart.getDay();
  const daysInMonth = new Date(calendarYear, calendarMonthIndex + 1, 0).getDate();

  const eventsByDay = useMemo(() => {
    const map = {};
    for (const event of calendarEvents) {
      const d = new Date(event.date);
      if (d.getFullYear() === calendarYear && d.getMonth() === calendarMonthIndex) {
        const day = d.getDate();
        if (!map[day]) {
          map[day] = [];
        }
        map[day].push(event);
      }
    }
    return map;
  }, [calendarEvents, calendarYear, calendarMonthIndex]);

  const monthLabel = useMemo(
    () =>
      calendarMonth.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      }),
    [calendarMonth],
  );

  const selectedDayEvents =
    activeCalendarDay != null && eventsByDay[activeCalendarDay]
      ? eventsByDay[activeCalendarDay]
      : [];

  const canManageCalendar = currentUser?.role === 'school_admin';

  if (currentUser?.role === 'parent') {
    return <ParentDashboard />;
  }

  const chartData =
    currentUser?.role === 'admin'
      ? {
          labels: ['Schools', 'Users', 'Messages (x10)', 'Revenue (x100)'],
          datasets: [
            {
              label: 'System Overview',
              data: [
                stats.schools,
                stats.users,
                Math.round(stats.messages / 10),
                Math.round(stats.revenue / 100),
              ],
              backgroundColor: [
                'rgba(59, 130, 246, 0.8)',
                'rgba(244, 63, 94, 0.8)',
                'rgba(16, 185, 129, 0.8)',
                'rgba(139, 92, 246, 0.8)',
              ],
              hoverBackgroundColor: [
                'rgba(59, 130, 246, 1)',
                'rgba(244, 63, 94, 1)',
                'rgba(16, 185, 129, 1)',
                'rgba(139, 92, 246, 1)',
              ],
              borderRadius: 8,
              borderSkipped: false,
              barPercentage: 0.6,
              categoryPercentage: 0.8,
            },
          ],
        }
      : {
          labels: ['Students', 'Teachers', 'Classes', 'Parents'],
          datasets: [
            {
              label: 'School Statistics',
              data: [stats.students, stats.teachers, stats.classes, stats.parents],
              backgroundColor: [
                'rgba(59, 130, 246, 0.8)',
                'rgba(244, 63, 94, 0.8)',
                'rgba(16, 185, 129, 0.8)',
                'rgba(139, 92, 246, 0.8)',
              ],
              hoverBackgroundColor: [
                'rgba(59, 130, 246, 1)',
                'rgba(244, 63, 94, 1)',
                'rgba(16, 185, 129, 1)',
                'rgba(139, 92, 246, 1)',
              ],
              borderRadius: 8,
              borderSkipped: false,
              barPercentage: 0.6,
              categoryPercentage: 0.8,
            },
          ],
        };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 tracking-tight">
            Dashboard Overview
          </h2>
          {currentUser?.role === 'school_admin' && currentUser?.school?.name ? (
            <p className="text-slate-500 mt-1">
              Welcome back,
              <span className="bg-gradient-to-r from-brand-600 to-secondary-600 bg-clip-text text-transparent font-bold ml-1">
                {currentUser.school.name}
              </span>
              ! Here&apos;s what&apos;s happening today.
            </p>
          ) : (
            <p className="text-slate-500 mt-1">
              Welcome back,
              <span className="bg-gradient-to-r from-brand-600 to-secondary-600 bg-clip-text text-transparent font-bold ml-1">
                {currentUser?.firstName || 'Guest'}
              </span>
              ! Here&apos;s what&apos;s happening today.
            </p>
          )}
        </div>
        <div className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm border border-white/50 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 transition-colors">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>

      {currentUser?.role === 'admin' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Building2}
            title="Total Schools"
            count={stats.schools}
            colorFrom="from-brand-500"
            colorTo="to-brand-400"
            iconColor="shadow-brand-500/40"
            buttonLabel="Manage"
            link="/dashboard/schools"
          />
          <StatCard
            icon={Users}
            title="School Admins"
            count={stats.users}
            colorFrom="from-secondary-500"
            colorTo="to-pink-500"
            iconColor="shadow-secondary-500/40"
            buttonLabel="View All"
            link="/dashboard/schools"
          />
          <StatCard
            icon={DollarSign}
            title="Total Revenue"
            count={formatCurrency(stats.revenue)}
            colorFrom="from-emerald-500"
            colorTo="to-teal-400"
            iconColor="shadow-emerald-500/40"
            buttonLabel="Finance"
            link="/dashboard/finance"
          />
          <StatCard
            icon={MessageSquare}
            title="Total Messages"
            count={stats.messages}
            colorFrom="from-amber-500"
            colorTo="to-orange-500"
            iconColor="shadow-amber-500/40"
            buttonLabel="View Logs"
            link="/dashboard/messages"
          />
        </div>
      ) : currentUser?.role === 'student' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={GraduationCap}
            title="My subject"
            count=""
            colorFrom="from-brand-500"
            colorTo="to-brand-400"
            iconColor="shadow-brand-500/40"
            buttonLabel="Open"
            link="/dashboard/subjects"
          />
          <StatCard
            icon={Users}
            title="Group studies"
            count=""
            colorFrom="from-secondary-500"
            colorTo="to-pink-500"
            iconColor="shadow-secondary-500/40"
            buttonLabel="Open"
            link="/dashboard/group-studies"
          />
          <StatCard
            icon={BookOpen}
            title="E-learning"
            count=""
            colorFrom="from-emerald-500"
            colorTo="to-teal-400"
            iconColor="shadow-emerald-500/40"
            buttonLabel="Open"
            link="/dashboard/e-learning"
          />
          <StatCard
            icon={Radio}
            title="Radio"
            count=""
            colorFrom="from-amber-500"
            colorTo="to-orange-500"
            iconColor="shadow-amber-500/40"
            buttonLabel="Listen"
            link="/dashboard/radio"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={GraduationCap}
            title="Total Students"
            count={stats.students}
            colorFrom="from-brand-500"
            colorTo="to-brand-400"
            iconColor="shadow-brand-500/40"
            buttonLabel="View All"
            link="/dashboard/students"
          />
          {(!currentUser || currentUser.role !== 'teacher') && (
            <StatCard
              icon={Users}
              title="Total Teachers"
              count={stats.teachers}
              colorFrom="from-secondary-500"
              colorTo="to-pink-500"
              iconColor="shadow-secondary-500/40"
              buttonLabel="View All"
              link="/dashboard/teachers"
            />
          )}
          <StatCard
            icon={Home}
            title="Total Classes"
            count={stats.classes}
            colorFrom="from-emerald-500"
            colorTo="to-teal-400"
            iconColor="shadow-emerald-500/40"
            buttonLabel="View All"
            link="/dashboard/classes"
          />
          {(!currentUser || currentUser.role !== 'teacher') && (
            currentUser?.role === 'school_admin' ? (
              <StatCard
                icon={DollarSign}
                title="Total Revenue"
                count={formatCurrency(stats.revenue)}
                colorFrom="from-amber-500"
                colorTo="to-orange-500"
                iconColor="shadow-amber-500/40"
                buttonLabel="Finance"
                link="/dashboard/finance"
              />
            ) : (
              <StatCard
                icon={CreditCard}
                title="Total Parents"
                count={stats.parents}
                colorFrom="from-amber-500"
                colorTo="to-orange-500"
                iconColor="shadow-amber-500/40"
                buttonLabel="Finance"
                link="/dashboard/finance"
              />
            )
          )}
        </div>
      )}

      {currentUser?.role === 'admin' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-3 bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-soft border border-white/50 p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[var(--ui-accent-soft)] text-[color:var(--ui-accent)]">
                  <BarChart2 size={20} />
                </div>
                <h3 className="text-xl font-bold text-slate-700">Statistics Overview</h3>
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
                      cornerRadius: 12,
                      titleFont: { size: 14, weight: 'bold' },
                      bodyFont: { size: 13 },
                      displayColors: false,
                    },
                  },
                  scales: {
                    y: {
                      grid: { color: '#f1f5f9' },
                      border: { display: false },
                      ticks: { color: '#64748b', font: { size: 12 } },
                    },
                    x: {
                      grid: { display: false },
                      border: { display: false },
                      ticks: { color: '#64748b', font: { weight: 'bold' } },
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-soft border border-white/50 p-6">
        <div className="flex justify-between items-center mb-6 border-b border-slate-100/50 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20"
                 style={{ backgroundImage: 'linear-gradient(to bottom right, var(--ui-accent-strong), var(--ui-accent))' }}>
              <span className="text-lg">📅</span>
            </div>
            <h3 className="font-bold text-slate-700">Events Calendar</h3>
          </div>
          {canManageCalendar && (
            <button
              type="button"
              onClick={() => setShowCalendarModal(true)}
              className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
            >
              + Add event
            </button>
          )}
        </div>

        <div className="text-center mb-6">
          <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">
            {monthLabel}
          </h3>
          <p className="text-sm text-slate-400 font-medium">School events for your school</p>
        </div>

        <div className="border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm bg-white/40 backdrop-blur-sm">
          <div className="grid grid-cols-7 bg-slate-50/80 border-b border-slate-200/60">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => {
              const isWeekendHeader = index === 0 || index === 6;
              return (
                <div
                  key={day}
                  className={`py-3 text-center text-xs font-bold uppercase tracking-wider ${
                    isWeekendHeader ? 'text-red-500' : 'text-slate-500'
                  }`}
                >
                  {day}
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: firstWeekday }).map((_, idx) => (
              <div
                key={`pad-${idx}`}
                className="h-24 border-r border-b border-slate-100/60 last:border-r-0 bg-slate-50/20"
              />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const dayEvents = eventsByDay[day] || [];
              const hasEvents = dayEvents.length > 0;
              const dayDateObj = new Date(calendarYear, calendarMonthIndex, day);
              const weekday = dayDateObj.getDay();
              const isWeekend = weekday === 0 || weekday === 6;
              const isToday =
                calendarYear === todayYear &&
                calendarMonthIndex === todayMonthIndex &&
                day === todayDate;

              return (
                <div
                  key={day}
                  className={`h-24 border-r border-b border-slate-100/60 dark:border-slate-700/60 last:border-r-0 p-1 relative transition-colors group cursor-pointer ${
                    isWeekend ? 'bg-red-50/40 dark:bg-red-900/10 hover:bg-red-50/70 dark:hover:bg-red-900/20' : 'hover:bg-white/60 dark:hover:bg-slate-700/60'
                  }`}
                  onClick={() => {
                    if (!hasEvents) return;
                    setActiveCalendarDay(day);
                    setShowDayEventsModal(true);
                  }}
                >
                  <span
                    className={`text-xs font-medium w-7 h-7 flex items-center justify-center rounded-full transition-all duration-300 ${
                      isToday
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/40 scale-110'
                        : hasEvents
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-md shadow-indigo-500/20 scale-105'
                        : isWeekend
                        ? 'text-red-500 dark:text-red-400 group-hover:bg-red-50 dark:group-hover:bg-red-900/30'
                        : 'text-slate-500 dark:text-slate-400 group-hover:bg-slate-100 dark:group-hover:bg-slate-800'
                    }`}
                  >
                    {day}
                  </span>
                  {hasEvents && (
                    <div className="mt-1.5 space-y-1 px-0.5">
                      {dayEvents.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          className="h-1.5 w-full bg-gradient-to-r from-indigo-200 to-purple-200 rounded-full"
                          title={event.title}
                        />
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-[10px] text-indigo-400 font-medium text-center">
                          +{dayEvents.length - 2}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {showDayEventsModal && activeCalendarDay != null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800">
                  Events on {activeCalendarDay} {monthLabel}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowDayEventsModal(false);
                    setActiveCalendarDay(null);
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>
              {selectedDayEvents.length === 0 ? (
                <p className="text-sm text-slate-500">No events for this day.</p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {selectedDayEvents.map((event) => (
                    <div
                      key={event.id}
                      className="border border-slate-100 rounded-lg p-3 bg-slate-50"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-800 truncate">
                          {event.title}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                          {event.type === 'sport' && 'Sport'}
                          {event.type === 'group_study' && 'Group Study'}
                          {event.type === 'exam' && 'Exam'}
                          {event.type === 'activity' && 'Activity'}
                          {event.type === 'notice' && 'Notice'}
                          {event.type === 'calendar' && 'Calendar'}
                        </span>
                      </div>
                      {event.description && (
                        <p className="text-xs text-slate-600 mt-1 whitespace-pre-line">
                          {event.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {showCalendarModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Add calendar event</h3>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    await api.post('/calendar', {
                      title: newCalendarEvent.title,
                      description: newCalendarEvent.description || undefined,
                      date: newCalendarEvent.date,
                    });
                    setShowCalendarModal(false);
                    setNewCalendarEvent({ title: '', description: '', date: '' });
                    const refresh = async () => {
                      try {
                        const response = await api.get('/calendar');
                        setCalendarEvents(response.data || []);
                      } catch (error) {
                        console.error('Failed to refresh calendar events:', error);
                      }
                    };
                    refresh();
                  } catch (error) {
                    alert(error.response?.data?.error || 'Failed to create event');
                  }
                }}
              >
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={newCalendarEvent.title}
                    onChange={(e) =>
                      setNewCalendarEvent((prev) => ({ ...prev, title: e.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={newCalendarEvent.date}
                    onChange={(e) =>
                      setNewCalendarEvent((prev) => ({ ...prev, date: e.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newCalendarEvent.description}
                    onChange={(e) =>
                      setNewCalendarEvent((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-lg h-24"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCalendarModal(false);
                      setNewCalendarEvent({ title: '', description: '', date: '' });
                    }}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
