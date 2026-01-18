import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Play, Menu, X, CheckCircle, ArrowRight, BookOpen, Users, Trophy, Video,
  Bus, Calendar, ClipboardList, CreditCard, Layout, Library, Activity, MessageSquare,
  GraduationCap, Bell, Search, Plus, MoreVertical, Home, BarChart2, DollarSign, Settings,
  FileText
} from 'lucide-react';

const StatCard = ({
  icon: Icon,
  title,
  count,
  colorFrom,
  colorTo,
  iconColor,
  buttonLabel,
}) => {
  return (
    <div className="group relative bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 overflow-hidden min-h-[180px] hover:shadow-md transition-all cursor-default">
      <div
        className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colorFrom} ${colorTo} opacity-10 rounded-bl-[100px] -mr-8 -mt-8 transition-all duration-500 group-hover:scale-110 group-hover:opacity-20`}
      />

      <div className="flex items-start justify-between mb-4 relative z-10">
        <div
          className={`p-3.5 rounded-2xl bg-gradient-to-br ${colorFrom} ${colorTo} shadow-lg ${iconColor} text-white transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}
        >
          <Icon size={24} strokeWidth={2.5} />
        </div>
        {buttonLabel && (
          <span
            className={`text-[10px] font-bold px-3 py-1 rounded-full bg-white/80 backdrop-blur-sm group-hover:bg-white shadow-sm transition-all border border-slate-100/50 bg-gradient-to-r ${colorFrom} ${colorTo} bg-clip-text text-transparent uppercase tracking-wider`}
          >
            {buttonLabel}
          </span>
        )}
      </div>

      <div className="relative z-10">
        <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1 opacity-80">
          {title}
        </h3>
        <span
          className={`bg-gradient-to-r ${colorFrom} ${colorTo} bg-clip-text text-transparent text-3xl font-display font-bold tracking-tight`}
        >
          {count}
        </span>
      </div>
    </div>
  );
};

const DemoDashboard = ({ role }) => {
  const getRoleData = (role) => {
    switch(role) {
      case 'admin':
        return {
          stats: [
            { icon: Users, title: "Total Students", count: "1,248", colorFrom: "from-blue-500", colorTo: "to-blue-600", iconColor: "shadow-blue-500/40" },
            { icon: GraduationCap, title: "Teachers", count: "84", colorFrom: "from-purple-500", colorTo: "to-purple-600", iconColor: "shadow-purple-500/40" },
            { icon: DollarSign, title: "Revenue", count: "$124k", colorFrom: "from-emerald-500", colorTo: "to-emerald-600", iconColor: "shadow-emerald-500/40" },
            { icon: Layout, title: "Schools", count: "3", colorFrom: "from-orange-500", colorTo: "to-orange-600", iconColor: "shadow-orange-500/40" },
          ],
          chartData: [65, 78, 66, 44, 56, 67, 75],
          actions: [
            { icon: Plus, label: "Admit Student", colorClass: "bg-blue-100 text-blue-600" },
            { icon: FileText, label: "Generate Reports", colorClass: "bg-purple-100 text-purple-600" },
            { icon: Settings, label: "System Settings", colorClass: "bg-slate-100 text-slate-600" },
          ]
        };
      case 'teacher':
        return {
          stats: [
            { icon: BookOpen, title: "My Classes", count: "6", colorFrom: "from-pink-500", colorTo: "to-rose-500", iconColor: "shadow-pink-500/40" },
            { icon: Users, title: "Students", count: "142", colorFrom: "from-blue-500", colorTo: "to-cyan-500", iconColor: "shadow-blue-500/40" },
            { icon: ClipboardList, title: "Pending Grading", count: "24", colorFrom: "from-amber-500", colorTo: "to-orange-500", iconColor: "shadow-amber-500/40" },
            { icon: Calendar, title: "Today's Classes", count: "4", colorFrom: "from-indigo-500", colorTo: "to-violet-500", iconColor: "shadow-indigo-500/40" },
          ],
          chartData: [85, 82, 90, 88, 85, 92, 89],
          actions: [
            { icon: CheckCircle, label: "Take Attendance", colorClass: "bg-green-100 text-green-600" },
            { icon: Plus, label: "New Assignment", colorClass: "bg-indigo-100 text-indigo-600" },
            { icon: MessageSquare, label: "Message Parents", colorClass: "bg-pink-100 text-pink-600" },
          ]
        };
      case 'student':
        return {
          stats: [
            { icon: Activity, title: "Attendance", count: "96%", colorFrom: "from-green-500", colorTo: "to-emerald-500", iconColor: "shadow-green-500/40" },
            { icon: BookOpen, title: "Assignments", count: "3", colorFrom: "from-blue-500", colorTo: "to-indigo-500", iconColor: "shadow-blue-500/40", buttonLabel: "Due Soon" },
            { icon: Trophy, title: "Avg Grade", count: "A-", colorFrom: "from-purple-500", colorTo: "to-fuchsia-500", iconColor: "shadow-purple-500/40" },
            { icon: Library, title: "Library Books", count: "2", colorFrom: "from-orange-500", colorTo: "to-amber-500", iconColor: "shadow-orange-500/40" },
          ],
          chartData: [70, 75, 80, 85, 82, 88, 90],
          actions: [
            { icon: Calendar, label: "View Timetable", colorClass: "bg-blue-100 text-blue-600" },
            { icon: FileText, label: "Submit Homework", colorClass: "bg-purple-100 text-purple-600" },
            { icon: Search, label: "Search Library", colorClass: "bg-orange-100 text-orange-600" },
          ]
        };
      case 'parent':
        return {
          stats: [
            { icon: Users, title: "Children", count: "2", colorFrom: "from-indigo-500", colorTo: "to-blue-500", iconColor: "shadow-indigo-500/40" },
            { icon: CreditCard, title: "Fees Due", count: "$0", colorFrom: "from-green-500", colorTo: "to-emerald-500", iconColor: "shadow-green-500/40", buttonLabel: "Paid" },
            { icon: MessageSquare, title: "Messages", count: "1", colorFrom: "from-pink-500", colorTo: "to-rose-500", iconColor: "shadow-pink-500/40" },
            { icon: Calendar, title: "Events", count: "3", colorFrom: "from-amber-500", colorTo: "to-yellow-500", iconColor: "shadow-amber-500/40" },
          ],
          chartData: [100, 100, 95, 100, 98, 100, 100],
          actions: [
            { icon: CreditCard, label: "Pay School Fees", colorClass: "bg-green-100 text-green-600" },
            { icon: MessageSquare, label: "Contact Teacher", colorClass: "bg-blue-100 text-blue-600" },
            { icon: FileText, label: "View Report Card", colorClass: "bg-purple-100 text-purple-600" },
          ]
        };
      default:
        return { stats: [], chartData: [], actions: [] };
    }
  };

  const data = getRoleData(role);

  return (
    <div className="flex h-full bg-slate-50 text-slate-800 font-sans overflow-hidden rounded-b-xl">
      {/* Sidebar (Mock) */}
      <div className="w-20 lg:w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-slate-100">
           <div className="bg-brand-500 p-1.5 rounded-lg text-white">
             <BookOpen size={20} className="text-indigo-600" />
           </div>
           <span className="font-bold text-lg text-slate-800 hidden lg:block">doonITes ERP</span>
        </div>
        <div className="p-4 space-y-2">
          {['Dashboard', 'Students', 'Teachers', 'Academics', 'Finance', 'Settings'].map((item, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer ${i === 0 ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>
              <div className={i === 0 ? 'text-indigo-600' : 'text-slate-400'}>
                {i === 0 ? <Layout size={20} /> : <div className="w-5 h-5 rounded-full border-2 border-current opacity-40"></div>}
              </div>
              <span className={`font-medium hidden lg:block ${i === 0 ? 'text-indigo-700' : ''}`}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4 text-slate-400 bg-slate-100 px-4 py-2 rounded-full w-64">
             <Search size={18} />
             <span className="text-sm">Search...</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Bell size={20} className="text-slate-400" />
              <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></div>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-indigo-500/20">
              {role.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">Dashboard</h2>
            <p className="text-slate-500 text-sm">Welcome back, {role === 'admin' ? 'Administrator' : role.charAt(0).toUpperCase() + role.slice(1)}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            {data.stats.map((stat, i) => (
               <StatCard key={i} {...stat} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="font-bold text-slate-800">Performance Overview</h3>
                 <select className="bg-slate-50 border border-slate-200 rounded-lg text-xs px-2 py-1 text-slate-600 outline-none">
                   <option>This Week</option>
                   <option>This Month</option>
                 </select>
               </div>
               <div className="h-48 flex items-end justify-between gap-4 px-2">
                  {data.chartData.map((h, i) => (
                    <div key={i} className="w-full bg-slate-50 rounded-t-lg relative group h-full flex items-end">
                       <div 
                         className="w-full bg-indigo-500 rounded-t-lg transition-all duration-1000 group-hover:bg-indigo-400"
                         style={{ height: `${h}%` }}
                       ></div>
                    </div>
                  ))}
               </div>
               <div className="flex justify-between mt-4 text-xs text-slate-400 px-2">
                 {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <span key={d}>{d}</span>)}
               </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
               <h3 className="font-bold text-slate-800 mb-4">Quick Actions</h3>
               <div className="space-y-3">
                 {data.actions.map((action, i) => (
                   <button key={i} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100 text-left group">
                     <div className={`p-2 rounded-lg ${action.colorClass} group-hover:scale-110 transition-transform`}>
                       <action.icon size={18} />
                     </div>
                     <span className="font-medium text-slate-700 text-sm">{action.label}</span>
                     <ArrowRight size={14} className="ml-auto text-slate-300 group-hover:text-indigo-500 transition-colors" />
                   </button>
                 ))}
               </div>
               
               <div className="mt-6 pt-6 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Upcoming Events</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                       <div className="bg-orange-100 text-orange-600 p-2 rounded-lg text-center min-w-[3rem]">
                         <span className="block text-xs font-bold">DEC</span>
                         <span className="block text-lg font-bold leading-none">12</span>
                       </div>
                       <div>
                         <p className="text-sm font-bold text-slate-700">Staff Meeting</p>
                         <p className="text-xs text-slate-500">10:00 AM - Conf Room</p>
                       </div>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDemoTab, setActiveDemoTab] = useState('admin');
  const navigate = useNavigate();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const demoTabs = [
    { id: 'admin', label: 'Administrator', icon: Layout },
    { id: 'teacher', label: 'Teacher', icon: BookOpen },
    { id: 'student', label: 'Student', icon: GraduationCap },
    { id: 'parent', label: 'Parent', icon: Users },
  ];

  const demoContent = {
    admin: {
      title: "Total Control at Your Fingertips",
      description: "Manage admissions, finances, and staff from a central command center. Get real-time insights into school performance with comprehensive analytics dashboards.",
      features: ["Global Analytics Dashboard", "Fee & Payroll Management", "Staff & Inventory Tracking"],
    },
    teacher: {
      title: "Focus on Teaching, Not Paperwork",
      description: "Automate attendance, grade assignments effortlessly, and communicate with parents directly through the portal. Streamline your daily classroom routines.",
      features: ["Digital Gradebook", "Automated Attendance", "Lesson Planning Tools"],
    },
    student: {
      title: "Your Academic Journey, Organized",
      description: "Access study materials, check exam schedules, and track your progress in real-time. Everything you need to succeed in your studies is just a click away.",
      features: ["Online Exams & Results", "Digital Library Access", "Class Timetable"],
    },
    parent: {
      title: "Stay Connected with Your Child",
      description: "Monitor attendance, fee payments, and academic performance from anywhere. Never miss an important update about your child's education.",
      features: ["Real-time Notifications", "Fee Payment Gateway", "Direct Teacher Chat"],
    }
  };

  return (
    <div className="min-h-screen bg-landing-primary text-landing-text font-sans">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center relative z-50">
        <div className="flex items-center gap-2">
           <div className="flex items-center gap-2 font-bold text-2xl tracking-tight">
             <div className="bg-landing-accent p-1.5 rounded-lg text-white">
               <BookOpen size={24} />
             </div>
             <span>doonITes ERP</span>
           </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 text-landing-muted font-medium">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#demo" className="hover:text-white transition-colors">Demo</a>
          <a href="#about" className="hover:text-white transition-colors">About</a>
          <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
        </nav>

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <Link to="/login" className="bg-landing-accent hover:bg-landing-secondary text-white px-6 py-2.5 rounded-full font-semibold transition-all shadow-lg shadow-landing-accent/20">
            Sign In
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden text-white" onClick={toggleMenu}>
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-landing-primary z-40 flex flex-col items-center justify-center gap-8 md:hidden">
          <Link to="/" onClick={toggleMenu} className="text-xl font-medium">Home</Link>
          <a href="#features" onClick={toggleMenu} className="text-xl font-medium">Features</a>
          <a href="#demo" onClick={toggleMenu} className="text-xl font-medium">Demo</a>
          <a href="#about" onClick={toggleMenu} className="text-xl font-medium">About</a>
          <Link to="/contact" onClick={toggleMenu} className="text-xl font-medium">Contact</Link>
          <Link to="/login" onClick={toggleMenu} className="bg-landing-accent text-white px-8 py-3 rounded-full font-bold text-lg">
            Sign In
          </Link>
        </div>
      )}

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 md:py-20 flex flex-col-reverse md:flex-row items-center gap-12">
        <div className="md:w-1/2 space-y-8 text-center md:text-left">
          <h1 className="text-4xl md:text-6xl font-display font-bold leading-tight">
            Streamline Your <br />
            <span className="text-landing-accent">School Operations</span>
          </h1>
          <p className="text-landing-muted text-lg md:text-xl max-w-lg mx-auto md:mx-0">
            A comprehensive management system connecting students, teachers, parents, and administrators in one unified platform.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
            <Link to="/login" className="bg-landing-accent hover:bg-landing-secondary text-white px-8 py-3.5 rounded-full font-bold text-lg transition-all shadow-lg shadow-landing-accent/30 flex items-center gap-2">
              Access Portal
            </Link>
            <button 
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center gap-2 text-white hover:text-landing-accent transition-colors font-medium px-6 py-3"
            >
              <span className="bg-white/10 p-2 rounded-full border border-white/20">
                <Play size={16} fill="currentColor" />
              </span>
              View Demo
            </button>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-1/4 left-10 opacity-10 animate-pulse hidden md:block">
            <Layout size={48} />
          </div>
          <div className="absolute bottom-1/4 right-10 opacity-10 animate-bounce hidden md:block">
            <Activity size={48} />
          </div>
        </div>

        <div className="md:w-1/2 relative">
          {/* Main Image Container */}
          <div className="relative z-10 rounded-full overflow-hidden border-8 border-white/5 bg-landing-secondary/20 aspect-square max-w-md mx-auto">
             <img 
               src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
               alt="School Management Dashboard" 
               className="w-full h-full object-cover"
             />
          </div>

          {/* Floating Card */}
          <div className="absolute top-1/2 -left-4 md:-left-12 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl flex items-center gap-3 z-20 shadow-xl transform -translate-y-1/2">
             <div className="bg-green-500/20 p-2 rounded-lg text-green-400">
               <CheckCircle size={24} />
             </div>
             <div>
               <p className="text-xs font-bold text-white">Attendance Tracked</p>
               <p className="text-xs text-landing-muted">Today: 98.5% Present</p>
             </div>
          </div>

          {/* Background Decorative Shapes */}
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-landing-accent/20 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-landing-secondary/20 rounded-full blur-3xl"></div>
        </div>
      </section>

      {/* Wave Separator */}
      <div className="w-full overflow-hidden leading-none relative -bottom-1">
        <svg className="relative block w-[calc(100%+1.3px)] h-[100px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="#FFFFFF"></path>
        </svg>
      </div>

      {/* Features Grid Section */}
      <section id="features" className="bg-white py-16 md:py-24 text-slate-800">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mb-4">
              Everything You Need to Run Your School
            </h2>
            <p className="text-slate-600">
              From admissions to alumni, our modular system handles every aspect of school administration with ease and efficiency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Users, title: "Student Management", desc: "Comprehensive profiles, academic history, and behavioral tracking." },
              { icon: Calendar, title: "Attendance & Timetable", desc: "Geo-fenced attendance marking and automated scheduling." },
              { icon: Trophy, title: "Exams & Grading", desc: "Flexible examination setup with automated report card generation." },
              { icon: Bus, title: "Transport", desc: "Real-time bus tracking and route management for safety." },
              { icon: Library, title: "Library Management", desc: "Digital cataloging, circulation tracking, and fine management." },
              { icon: CreditCard, title: "Fee Collection", desc: "Online fee payments, invoice generation, and financial reports." },
              { icon: MessageSquare, title: "Communication", desc: "Instant notifications and messaging between parents and teachers." },
              { icon: Video, title: "Virtual Classroom", desc: "Integrated live classes and digital homework submission." },
            ].map((feature, i) => (
              <div key={i} className="bg-slate-50 p-6 rounded-2xl hover:shadow-lg transition-all border border-slate-100 group">
                <div className="bg-white w-12 h-12 rounded-xl flex items-center justify-center text-landing-secondary shadow-sm mb-4 group-hover:bg-landing-accent group-hover:text-white transition-colors">
                  <feature.icon size={24} />
                </div>
                <h3 className="font-bold text-lg text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo/Preview Section */}
      <section id="demo" className="bg-landing-primary text-white py-20 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-landing-accent/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-landing-secondary/10 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
             <div className="inline-block bg-landing-accent/20 text-landing-accent px-4 py-1.5 rounded-full text-sm font-bold mb-4 border border-landing-accent/30">
               Live Preview
             </div>
             <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
               Experience the Platform
             </h2>
             <p className="text-landing-muted text-lg">
               See how doonITes ERP adapts to every role in your institution, providing a tailored experience for admins, teachers, and students.
             </p>
          </div>

          {/* Interactive Demo Tabs */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-10 shadow-2xl">
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              {demoTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveDemoTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${
                    activeDemoTab === tab.id 
                      ? 'bg-landing-accent text-white shadow-lg shadow-landing-accent/25' 
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <tab.icon size={18} />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6 animate-fadeIn">
                <h3 className="text-3xl font-bold text-white">
                  {demoContent[activeDemoTab].title}
                </h3>
                <p className="text-landing-muted text-lg leading-relaxed">
                  {demoContent[activeDemoTab].description}
                </p>
                <ul className="space-y-4 pt-4">
                  {demoContent[activeDemoTab].features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-slate-200">
                      <div className="bg-green-500/20 p-1 rounded-full text-green-400">
                        <CheckCircle size={16} />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="pt-6">
                  <Link to="/login" className="inline-flex items-center gap-2 text-landing-accent font-bold hover:gap-3 transition-all group">
                    Try {demoTabs.find(t => t.id === activeDemoTab).label} Portal 
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-landing-accent to-landing-secondary rounded-xl opacity-50 blur group-hover:opacity-75 transition duration-1000"></div>
                <div className="relative bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-2xl aspect-video flex flex-col">
                  {/* Browser Toolbar */}
                  <div className="bg-slate-800 px-4 py-3 flex items-center gap-2 border-b border-slate-700 shrink-0">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="ml-4 bg-slate-900/50 px-3 py-1 rounded text-xs text-slate-500 font-mono flex-1">
                      app.doonites.org/dashboard/{activeDemoTab}
                    </div>
                  </div>
                  {/* Content Component */}
                  <div className="flex-1 overflow-hidden bg-slate-50 relative">
                     <DemoDashboard role={activeDemoTab} />
                     
                     {/* Overlay Interaction Hint */}
                     <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About/Strategy Section */}
      <section id="about" className="bg-slate-50 py-16 md:py-24 text-slate-800">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-16">
          <div className="md:w-1/2 relative">
             <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl bg-white transform rotate-2 hover:rotate-0 transition-transform duration-500">
               <img 
                 src="https://images.unsplash.com/photo-1531403009284-440f080d1e12?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                 alt="Dashboard Preview" 
                 className="w-full h-auto"
               />
             </div>
             
             {/* Floating Badge */}
             <div className="absolute -bottom-6 -left-6 bg-white shadow-xl p-4 rounded-xl flex items-center gap-4 animate-float z-20">
                <div className="bg-blue-500 p-3 rounded-lg text-white">
                  <ClipboardList size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">Report Cards</p>
                  <p className="text-xs text-green-500 font-bold">Generated Instantly</p>
                </div>
             </div>
          </div>

          <div className="md:w-1/2 space-y-6">
            <div className="flex items-center gap-2 text-landing-secondary font-bold uppercase tracking-wider text-sm">
              <span className="w-8 h-0.5 bg-landing-secondary"></span>
              Why Choose doonITes ERP
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900">
              Data-Driven Decisions for <br />
              Educational Excellence
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Empower your administration with real-time insights. Our platform provides deep analytics on student performance, resource utilization, and financial health, helping you make informed decisions that drive growth.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 pt-4">
              {[
                "Role-Based Access Control",
                "Secure Cloud Storage",
                "Mobile App Support",
                "24/7 Technical Support"
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle size={20} className="text-landing-accent" />
                  <span className="font-medium text-slate-700">{item}</span>
                </div>
              ))}
            </div>
            
            <button className="mt-6 flex items-center gap-2 text-landing-secondary font-bold hover:gap-3 transition-all">
              Explore All Features <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-10 border-t border-slate-800">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 font-bold text-xl text-white">
             <BookOpen size={24} className="text-landing-accent" />
             <span>doonITes ERP</span>
          </div>
          
          <div className="flex gap-8 text-sm font-medium text-slate-400">
            <Link to="/contact" className="hover:text-landing-accent transition-colors">Contact</Link>
            <a href="#about" className="hover:text-landing-accent transition-colors">About</a>
            <a href="#features" className="hover:text-landing-accent transition-colors">Features</a>
          </div>

          <div className="text-xs text-slate-500">
            © {new Date().getFullYear()} doonITes ERP. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
