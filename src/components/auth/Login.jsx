import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { BookOpen, Loader, Lock, Mail, Sparkles, AlertCircle, ShieldCheck } from 'lucide-react';
import { API_URL } from '../../config';
import { GradientButton } from '../ui/GradientButton';
import { InputField } from '../ui/InputField';

export const Login = ({ onLogin, addToast }) => {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const loginBackgroundStyle = {
    backgroundImage:
      'linear-gradient(120deg, rgba(10, 77, 156, 0.82) 0%, rgba(30, 115, 190, 0.64) 35%, rgba(5, 25, 53, 0.56) 100%), url("/login-campus-bg.jpg")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  };

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
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden p-4 font-sans" style={loginBackgroundStyle}>
      <div className="absolute inset-0 backdrop-blur-[2px]" />

      <motion.div
        className="absolute -left-14 top-[18%] h-72 w-72 rounded-full bg-white/12 blur-3xl"
        animate={{ y: [0, -28, 0], x: [0, 18, 0], opacity: [0.55, 0.88, 0.55] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -right-20 bottom-[14%] h-80 w-80 rounded-full bg-[#1E73BE]/30 blur-3xl"
        animate={{ y: [0, 24, 0], x: [0, -20, 0], opacity: [0.45, 0.78, 0.45] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute left-[42%] top-[9%] h-36 w-36 rounded-full bg-[#FFC107]/25 blur-2xl"
        animate={{ scale: [1, 1.26, 1], opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* VVIT Branding - Top Right */}
      <motion.div
        className="absolute right-8 top-8 flex items-center gap-2 rounded-lg border border-white/45 bg-white/15 px-4 py-2 shadow-lg backdrop-blur-md"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        <BookOpen size={16} className="text-white" />
        <Sparkles size={14} className="text-white/90" />
        <span className="text-xs font-semibold text-white">VVIT Faculty Portal</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-lg"
      >
        <motion.div
          className="pointer-events-none absolute -inset-1 rounded-3xl bg-gradient-to-r from-[#0A4D9C]/65 via-[#1E73BE]/40 to-[#0A4D9C]/65 blur-sm"
          animate={{ opacity: [0.45, 0.85, 0.45] }}
          transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-2xl backdrop-blur-xl" style={{ boxShadow: '0 26px 72px -16px rgba(5, 25, 53, 0.5)' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-[#0A4D9C]/5 pointer-events-none" />

          <div className="relative border-b border-white/50 bg-gradient-to-r from-[#0A4D9C] via-[#1E73BE] to-[#0A4D9C] px-7 py-6 text-white sm:px-8">
            <div className="flex items-start gap-4">
              <motion.div
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 2.4, repeat: Infinity }}
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-white/35 bg-white/15 backdrop-blur-md"
              >
                <img src="/vvit-logo.svg" alt="VVIT Logo" className="h-12 w-12" />
              </motion.div>
              <div className="min-w-0">
                <div className="mb-1 inline-flex items-center gap-1 rounded-full border border-white/35 bg-white/15 px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-[0.14em]">
                  <Sparkles size={11} />
                  Faculty Access
                </div>
                <h1 className="text-2xl font-bold leading-tight">Faculty Portal</h1>
                <p className="mt-1 text-xs text-white/85">Vasireddy Venkatadri Institute of Technology</p>
              </div>
            </div>
          </div>

          <div className="relative px-7 pb-7 pt-6 sm:px-8 sm:pb-8">
            <div className="mb-5 flex items-center justify-between rounded-xl border border-[#D0E2F7] bg-[#F4F7FB] px-4 py-2.5">
              <span className="text-xs font-semibold text-[#0A4D9C]">Smart Leave & Substitution Management</span>
              <div className="flex items-center gap-1.5 text-[#228B22]">
                <ShieldCheck size={14} />
                <span className="text-[0.7rem] font-bold uppercase tracking-wider">Secure</span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#0A4D9C]">Email Address</label>
                <InputField
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="faculty@vvit.edu"
                  icon={Mail}
                  disabled={isLoggingIn}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#0A4D9C]">Password</label>
                <InputField
                  type="password"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  placeholder="Enter your password"
                  icon={Lock}
                  disabled={isLoggingIn}
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 rounded-lg border border-[#CD5C5C]/30 bg-[#FFF4F0] px-3 py-2 text-center text-sm font-medium text-[#CD5C5C]"
                >
                  <AlertCircle size={16} />
                  {error}
                </motion.div>
              )}

              <GradientButton type="submit" disabled={isLoggingIn} className="mt-6 w-full py-3 text-base font-bold">
                {isLoggingIn ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader className="animate-spin" size={18} />
                    <span>Signing In...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Sparkles size={16} />
                    <span>Access Dashboard</span>
                  </div>
                )}
              </GradientButton>
            </form>

            <div className="mt-6 border-t border-[#E0E0E0] pt-4 text-center">
              <p className="text-xs text-[#666666]">Use official VVIT credentials to continue</p>
            </div>
          </div>

          <div className="pointer-events-none absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-[#1E73BE]/15 blur-3xl" />
          <div className="pointer-events-none absolute -left-8 top-1/2 h-24 w-24 rounded-full bg-[#FFC107]/10 blur-2xl" />
        </div>
      </motion.div>
    </div>
  );
};