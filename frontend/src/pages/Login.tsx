import { useForm } from 'react-hook-form';
import { useAuth } from '../context/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useState } from 'react';
import axios from 'axios';
import type { LoginCredentials } from '../types';
import ProjectifyIcon from '../assets/icon.webp';

export default function Login() {
  const { register, handleSubmit } = useForm<LoginCredentials>();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [focused, setFocused] = useState<Record<string, boolean>>({});

  const onSubmit = async (data: LoginCredentials) => {
    try {
      await login(data);
      toast.success('Welcome back');
      navigate('/dashboard');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 403) {
          toast.error('Your account is awaiting admin approval');
        } else {
          toast.error('Invalid email or password');
        }
      } else {
        toast.error('An unexpected error occurred');
      }
    }
  };

  const quickLogin = async (email: string) => {
    try {
      await login({ email, password: 'password123' });
      toast.success('Welcome to Projectify Demo!');
      navigate('/dashboard');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.error || 'Quick login failed');
      } else {
        toast.error('Quick login failed');
      }
    }
  };

  const handleFocus = (name: string) =>
    setFocused((p) => ({ ...p, [name]: true }));

  const handleBlur = (name: string, value: string) =>
    setFocused((p) => ({ ...p, [name]: value !== '' }));

  return (
    <div className="w-screen min-h-screen flex items-center justify-center bg-[#f8fafc] relative overflow-hidden p-4 font-['Inter']">
      {/* Light Live Animated Mesh Gradient Orbs */}
      <div className="absolute inset-0 dot-pattern-light pointer-events-none opacity-60"></div>
      
      {/* Orb 1: Soft Indigo / Violet Glow */}
      <div className="absolute -top-28 -left-28 w-[540px] h-[540px] rounded-full bg-gradient-to-tr from-indigo-300/40 to-purple-300/35 blur-[110px] animate-aurora-1 pointer-events-none"></div>

      {/* Orb 2: Sky / Cyan Vibrant Sheen */}
      <div className="absolute -bottom-32 -right-32 w-[580px] h-[580px] rounded-full bg-gradient-to-br from-sky-300/40 to-cyan-200/45 blur-[120px] animate-aurora-2 pointer-events-none"></div>

      {/* Orb 3: Peach / Rose Warm Ambient Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full bg-gradient-to-r from-rose-200/35 via-pink-200/30 to-amber-200/35 blur-[100px] animate-aurora-3 pointer-events-none"></div>

      {/* Card with Cool Animated Border Beam (Light Mode) */}
      <div className="w-full max-w-md border-beam-card shadow-2xl z-10 transition-transform">
        <div className="border-beam-inner p-8 sm:p-10 border border-white/80 text-slate-800">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-white shadow-md overflow-hidden flex items-center justify-center p-2.5 border border-slate-100 mx-auto mb-3">
              <img src={ProjectifyIcon} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-4xl font-black font-['Outfit'] tracking-tight text-slate-900">
              Projectify<span className="text-primary">.</span>
            </h1>
            <p className="mt-1 text-xs text-slate-500 tracking-wide font-medium">Interactive Showcase Demo</p>
          </div>

          {/* 1-Click Demo Login Personas */}
          <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/70 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                1-Click Demo Personas
              </span>
              <span className="badge badge-xs bg-indigo-100 text-primary border-none font-bold px-2 py-1">Instant Access</span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Choose a persona to explore role-based permissions:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => quickLogin('admin@projectify.com')}
                className="group p-2.5 rounded-xl bg-white hover:bg-amber-50/70 border border-slate-200/80 hover:border-amber-300 text-slate-800 shadow-xs transition-all duration-200 flex flex-col items-center hover:scale-105 active:scale-95"
              >
                <span className="text-xs font-black text-slate-900 group-hover:text-amber-700 transition-colors">👑 Admin</span>
                <span className="text-[10px] font-semibold text-slate-500 group-hover:text-amber-800">Full Control</span>
              </button>
              <button
                type="button"
                onClick={() => quickLogin('leader@projectify.com')}
                className="group p-2.5 rounded-xl bg-white hover:bg-indigo-50/70 border border-slate-200/80 hover:border-indigo-300 text-slate-800 shadow-xs transition-all duration-200 flex flex-col items-center hover:scale-105 active:scale-95"
              >
                <span className="text-xs font-black text-slate-900 group-hover:text-primary transition-colors">🚀 Leader</span>
                <span className="text-[10px] font-semibold text-slate-500 group-hover:text-indigo-800">Team Lead</span>
              </button>
              <button
                type="button"
                onClick={() => quickLogin('sarah@projectify.com')}
                className="group p-2.5 rounded-xl bg-white hover:bg-sky-50/70 border border-slate-200/80 hover:border-sky-300 text-slate-800 shadow-xs transition-all duration-200 flex flex-col items-center hover:scale-105 active:scale-95"
              >
                <span className="text-xs font-black text-slate-900 group-hover:text-sky-700 transition-colors">💻 Member</span>
                <span className="text-[10px] font-semibold text-slate-500 group-hover:text-sky-800">Developer</span>
              </button>
            </div>
          </div>

          <div className="divider text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-6 before:bg-slate-200 after:bg-slate-200">
            Or Sign In Manually
          </div>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div className="relative">
              <input
                type="email"
                {...register('email', { required: true })}
                placeholder=" "
                onFocus={() => handleFocus('email')}
                onBlur={(e) => handleBlur('email', e.target.value)}
                className="peer w-full bg-slate-50/90 border-b-2 border-slate-300 focus:border-primary outline-none py-3 px-3 rounded-t-xl transition-all text-slate-900 placeholder-transparent text-sm focus:bg-white"
              />
              <label
                className={`absolute left-3 top-3 text-sm transition-all pointer-events-none
                  ${focused.email ? '-translate-y-6 text-xs text-primary font-bold' : 'text-slate-400'}
                `}
              >
                Email
              </label>
            </div>

            <div className="relative">
              <input
                type="password"
                {...register('password', { required: true })}
                placeholder=" "
                onFocus={() => handleFocus('password')}
                onBlur={(e) => handleBlur('password', e.target.value)}
                className="peer w-full bg-slate-50/90 border-b-2 border-slate-300 focus:border-primary outline-none py-3 px-3 rounded-t-xl transition-all text-slate-900 placeholder-transparent text-sm focus:bg-white"
              />
              <label
                className={`absolute left-3 top-3 text-sm transition-all pointer-events-none
                  ${focused.password ? '-translate-y-6 text-xs text-primary font-bold' : 'text-slate-400'}
                `}
              >
                Password
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 btn btn-primary text-white font-black tracking-wide rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 border-none"
            >
              Sign In
            </button>
          </form>

          <p className="mt-6 text-center text-slate-500 text-xs">
            Want to test approval flow?{' '}
            <Link to="/register" className="text-primary font-bold hover:underline transition-colors">
              Register New User
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
