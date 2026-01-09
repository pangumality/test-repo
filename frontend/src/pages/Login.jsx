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
      console.error(err);
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-teal-700 relative overflow-hidden">
      {/* Background Geometric Shapes (Abstract representation of screenshot) */}
      <div className="absolute inset-0 bg-teal-800 transform -skew-y-6 origin-top-left translate-y-20 z-0"></div>
      <div className="absolute inset-0 bg-teal-600 transform skew-y-6 origin-bottom-right -translate-y-20 z-0 opacity-50"></div>

      <div className="bg-white p-8 rounded shadow-lg w-full max-w-md z-10 relative">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full border-2 border-orange-500 flex items-center justify-center overflow-hidden bg-white">
             {logoUrl ? (
               <img src={logoUrl} alt="logo" className="w-full h-full object-cover rounded-full" />
             ) : (
               <div className="text-orange-500 font-bold text-2xl flex gap-1">
                  <User size={20} />
                  <User size={20} />
               </div>
             )}
          </div>
        </div>

        <h2 className="text-center text-gray-700 text-xl font-medium mb-1">Login to your account</h2>
        <p className="text-center text-gray-400 text-sm mb-8">Your credentials</p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <div className="relative">
               <span className="absolute left-3 top-3 text-gray-400">
                 <User size={18} />
               </span>
               <input 
                 type="email" 
                 className="w-full bg-blue-50 border border-blue-100 rounded pl-10 pr-4 py-2 text-gray-700 focus:outline-none focus:border-blue-300"
                 placeholder="Email Address"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 required
               />
            </div>
          </div>

          <div className="mb-6">
            <div className="relative">
               <span className="absolute left-3 top-3 text-gray-400">
                 <Lock size={18} />
               </span>
               <input 
                 type="password" 
                 className="w-full bg-blue-50 border border-blue-100 rounded pl-10 pr-4 py-2 text-gray-700 focus:outline-none focus:border-blue-300"
                 placeholder="Password"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 required
               />
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <label className="flex items-center text-gray-600 text-sm cursor-pointer">
              <input type="checkbox" className="mr-2 rounded text-blue-500 focus:ring-blue-500" />
              Remember
            </label>
            <a href="#" className="text-blue-400 text-sm hover:underline">Forgot password?</a>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 rounded flex items-center justify-center gap-2 transition duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <>Sign in <ArrowRight size={16} /></>}
          </button>
        </form>
      </div>
      
      <footer className="absolute bottom-0 left-0 right-0 text-center text-xs text-white z-10 bg-[#0f1240] py-2">
        © 2025 doonITes weBBed serVIces. All Rights Reserved.<br />
        Visit: erp@geenie.org | Call: +91-9258622202
      </footer>
    </div>
  );
};

export default Login;
