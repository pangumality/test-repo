import React, { useState } from 'react';
import { User, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
const logoUrl = import.meta.env.VITE_LOGO_URL || '/logo.jpg';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log('Logging in with API BaseURL:', api.defaults.baseURL);
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', {
        email,
        password
      });

      const { token, user } = response.data;
      
      // Store auth data
      localStorage.setItem('authToken', token);
      localStorage.setItem('currentUser', JSON.stringify(user));
      
      // For demo compatibility with existing localStorage logic
      // We'll mimic the "current_demo_user_id" which the DashboardLayout uses
      localStorage.setItem('current_demo_user_id', user.id);
      
      // Redirect
      navigate('/');
      
      // Force reload to ensure context picks up new user (simple way for now)
      window.location.reload();

    } catch (err) {
      console.error('Login Error Object:', err);
      console.error('Login Error Response:', err.response);
      console.error('Login Error Data:', err.response?.data);
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
      {/* Background Gradients & Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-brand-400/30 to-purple-500/30 blur-[100px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-secondary-400/30 to-pink-500/30 blur-[100px] animate-pulse-slow delay-1000"></div>
        <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] rounded-full bg-gradient-to-br from-brand-300/20 to-secondary-300/20 blur-[80px] animate-pulse-slow delay-500"></div>
      </div>

      <div className="w-full max-w-md z-10 relative px-4">
        {/* Glassmorphism Card */}
        <div className="bg-white/70 backdrop-blur-2xl rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-white/50 relative overflow-hidden group hover:shadow-brand-500/10 transition-all duration-500">
          
          {/* Top Decorative Line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-500 to-transparent opacity-50"></div>

          <div className="flex flex-col items-center justify-center mb-8">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-brand-500 to-secondary-500 p-[2px] shadow-lg shadow-brand-500/30 mb-6 rotate-3 hover:rotate-6 transition-transform duration-300">
              <div className="w-full h-full rounded-[22px] bg-white flex items-center justify-center overflow-hidden relative">
                 {logoUrl ? (
                   <img src={logoUrl} alt="logo" className="w-full h-full object-cover" />
                 ) : (
                   <div className="bg-gradient-to-br from-brand-500 to-secondary-500 w-full h-full flex items-center justify-center text-white">
                      <div className="flex -space-x-2">
                        <User size={28} className="opacity-90" />
                        <User size={28} className="opacity-70" />
                      </div>
                   </div>
                 )}
              </div>
            </div>

            <h2 className="text-center text-3xl font-display font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">Welcome Back</h2>
            <p className="text-center text-slate-500 text-sm font-medium tracking-wide">Enter your credentials to access your account</p>
          </div>

          {error && (
            <div className="bg-red-50/80 backdrop-blur-sm border border-red-100 text-red-600 px-4 py-3 rounded-2xl mb-6 text-sm flex items-center justify-center shadow-sm animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="group/input">
              <div className="relative transition-all duration-300 transform group-hover/input:-translate-y-1">
                 <div className="absolute left-4 top-3.5 text-slate-400 group-focus-within/input:text-brand-500 transition-colors">
                   <User size={20} strokeWidth={2} />
                 </div>
                 <input 
                   type="email" 
                   className="w-full bg-white/50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm group-hover/input:shadow-md backdrop-blur-sm"
                   placeholder="Email Address"
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   required
                 />
              </div>
            </div>

            <div className="group/input">
              <div className="relative transition-all duration-300 transform group-hover/input:-translate-y-1">
                 <div className="absolute left-4 top-3.5 text-slate-400 group-focus-within/input:text-brand-500 transition-colors">
                   <Lock size={20} strokeWidth={2} />
                 </div>
                 <input 
                   type="password" 
                   className="w-full bg-white/50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm group-hover/input:shadow-md backdrop-blur-sm"
                   placeholder="Password"
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   required
                 />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center text-slate-500 text-sm cursor-pointer hover:text-slate-700 transition-colors group">
                <input type="checkbox" className="mr-2.5 w-4 h-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500 transition-all cursor-pointer" />
                <span className="group-hover:translate-x-0.5 transition-transform">Remember me</span>
              </label>
              <a href="#" className="text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline decoration-2 underline-offset-4 transition-all">Forgot password?</a>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 mt-4 group"
            >
              {loading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <>
                  Sign in 
                  <ArrowRight size={20} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
        
        <footer className="text-center mt-8 space-y-2">
          <p className="text-xs text-slate-400 font-medium tracking-wide">
            © 2025 doonITes weBBed serVIces
          </p>
          <div className="flex items-center justify-center gap-4 text-[10px] text-slate-400 uppercase tracking-widest opacity-60">
            <span>erp@geenie.org</span>
            <span className="w-1 h-1 rounded-full bg-slate-400"></span>
            <span>+91-9258622202</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Login;
