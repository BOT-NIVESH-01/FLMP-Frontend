import React, { useState } from 'react';
import axios from 'axios';
import { BookOpen, Loader } from 'lucide-react';
import { API_URL } from '../../config';

export const Login = ({ onLogin, addToast }) => {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password: pass });
      localStorage.setItem('token', res.data.token);
      onLogin(res.data.user);
    } catch (err) {
      setError(err.response?.data?.msg || 'Login failed');
      addToast(err.response?.data?.msg || 'Login failed', 'error');
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Premium Glassmorphic Educational Themed Background */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=2070&q=80')" }}
      >
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
      </div>

      <div className="bg-white/10 backdrop-blur-2xl w-full max-w-md p-10 rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] border border-white/20 border-t-white/50 border-l-white/50 relative z-10 overflow-hidden">
        
        {/* Decorative glass reflection gradient inside the card */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 via-transparent to-black/20 pointer-events-none"></div>

        {/* Glowing Orbs for Vibrant Reflection */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-cyan-400 rounded-full mix-blend-screen filter blur-[60px] opacity-60 pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-blue-600 rounded-full mix-blend-screen filter blur-[60px] opacity-60 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="bg-gradient-to-br from-cyan-400 to-blue-600 p-4 rounded-2xl shadow-[0_10px_25px_rgba(6,182,212,0.5)] mb-6 text-white border border-cyan-300/50">
            <BookOpen size={44} strokeWidth={2} />
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight drop-shadow-md">Faculty Portal</h2>
          <p className="text-cyan-100 text-sm font-medium mb-8 text-center drop-shadow-sm">Smart Leave & Substitution Management</p>

          <form onSubmit={handleLogin} className="w-full flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.8rem] font-bold text-cyan-50 pl-1 tracking-wider uppercase drop-shadow-sm">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900/40 border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder-cyan-200/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:bg-slate-900/60 transition-all shadow-inner backdrop-blur-md"
                placeholder="e.g., mrntagore@vvit.edu"
                disabled={isLoggingIn}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.8rem] font-bold text-cyan-50 pl-1 tracking-wider uppercase drop-shadow-sm">Password</label>
              <input
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                className="w-full bg-slate-900/40 border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder-cyan-200/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:bg-slate-900/60 transition-all shadow-inner backdrop-blur-md"
                placeholder="Enter your password"
                disabled={isLoggingIn}
              />
            </div>
            
            {error && <p className="text-rose-200 text-sm font-semibold text-center bg-rose-900/50 border border-rose-400/50 p-2.5 rounded-xl shadow-lg backdrop-blur-md">{error}</p>}
            
            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-4 rounded-xl shadow-[0_8px_20px_rgba(6,182,212,0.4)] transition-all active:scale-[0.98] mt-4 flex justify-center items-center gap-2 border border-cyan-400/50" 
              disabled={isLoggingIn}
            >
              {isLoggingIn ? <Loader className="animate-spin" size={20} /> : 'Sign In To Portal'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};