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
    <div className="w-screen min-h-screen flex items-center justify-center bg-[#070b14] relative overflow-hidden p-4 font-['Inter']">
      {/* Dynamic Animated Mesh Gradient Orbs */}
      <div className="absolute inset-0 dot-pattern-bg pointer-events-none opacity-40"></div>
      
      {/* Orb 1: Indigo / Violet Glow */}
      <div className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full bg-gradient-to-tr from-indigo-600/35 to-violet-600/30 blur-[130px] animate-aurora-1 pointer-events-none"></div>

      {/* Orb 2: Cyan / Blue Sheen */}
      <div className="absolute -bottom-36 -right-36 w-[560px] h-[560px] rounded-full bg-gradient-to-br from-cyan-500/25 to-blue-700/30 blur-[140px] animate-aurora-2 pointer-events-none"></div>

      {/* Orb 3: Pink / Purple Ambient Center */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] rounded-full bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-primary/25 blur-[120px] animate-aurora-3 pointer-events-none"></div>

      {/* Card with God-Tier Animated Border Beam */}
      <div className="w-full max-w-md border-beam-card shadow-[0_20px_70px_rgba(0,0,0,0.65)] z-10 transition-transform">
        <div className="border-beam-inner p-8 sm:p-10 border border-white/10 text-white">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/15 to-white/5 shadow-[0_0_25px_rgba(99,102,241,0.4)] overflow-hidden flex items-center justify-center p-2.5 border border-white/20 mx-auto mb-3 backdrop-blur-md">
              <img src={ProjectifyIcon} alt="Logo" className="w-full h-full object-contain drop-shadow" />
            </div>
            <h1 className="text-4xl font-black font-['Outfit'] tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-400 bg-clip-text text-transparent">
              Projectify<span className="text-primary">.</span>
            </h1>
            <p className="mt-1 text-xs text-white/50 tracking-wide font-medium">Interactive Showcase Demo</p>
          </div>

          {/* 1-Click Demo Login Personas */}
          <div className="mb-6 p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                1-Click Demo Personas
              </span>
              <span className="badge badge-xs badge-primary font-bold px-2 py-1">Instant Access</span>
            </div>
            <p className="text-[11px] text-white/50 mb-3">
              Explore role-based permissions and live sample data:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => quickLogin('admin@projectify.com')}
                className="group relative p-2.5 rounded-xl bg-gradient-to-b from-white/10 to-white/[0.02] border border-white/15 hover:border-primary/60 hover:shadow-[0_0_20px_rgba(99,102,241,0.35)] transition-all duration-300 flex flex-col items-center hover:scale-105 active:scale-95"
              >
                <span className="text-xs font-black text-white group-hover:text-primary transition-colors">👑 Admin</span>
                <span className="text-[9px] font-medium text-white/40 group-hover:text-white/70">Full Control</span>
              </button>
              <button
                type="button"
                onClick={() => quickLogin('leader@projectify.com')}
                className="group relative p-2.5 rounded-xl bg-gradient-to-b from-white/10 to-white/[0.02] border border-white/15 hover:border-primary/60 hover:shadow-[0_0_20px_rgba(99,102,241,0.35)] transition-all duration-300 flex flex-col items-center hover:scale-105 active:scale-95"
              >
                <span className="text-xs font-black text-white group-hover:text-primary transition-colors">🚀 Leader</span>
                <span className="text-[9px] font-medium text-white/40 group-hover:text-white/70">Team Lead</span>
              </button>
              <button
                type="button"
                onClick={() => quickLogin('sarah@projectify.com')}
                className="group relative p-2.5 rounded-xl bg-gradient-to-b from-white/10 to-white/[0.02] border border-white/15 hover:border-primary/60 hover:shadow-[0_0_20px_rgba(99,102,241,0.35)] transition-all duration-300 flex flex-col items-center hover:scale-105 active:scale-95"
              >
                <span className="text-xs font-black text-white group-hover:text-primary transition-colors">💻 Member</span>
                <span className="text-[9px] font-medium text-white/40 group-hover:text-white/70">Developer</span>
              </button>
            </div>
          </div>

          <div className="divider text-[10px] uppercase font-bold tracking-widest text-white/30 mb-6 before:bg-white/10 after:bg-white/10">
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
                className="peer w-full bg-white/[0.05] border-b-2 border-white/20 focus:border-primary outline-none py-3 px-3 rounded-t-xl transition-all text-white placeholder-transparent text-sm focus:bg-white/[0.08]"
              />
              <label
                className={`absolute left-3 top-3 text-sm transition-all pointer-events-none
                  ${focused.email ? '-translate-y-6 text-xs text-primary font-bold' : 'text-white/40'}
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
                className="peer w-full bg-white/[0.05] border-b-2 border-white/20 focus:border-primary outline-none py-3 px-3 rounded-t-xl transition-all text-white placeholder-transparent text-sm focus:bg-white/[0.08]"
              />
              <label
                className={`absolute left-3 top-3 text-sm transition-all pointer-events-none
                  ${focused.password ? '-translate-y-6 text-xs text-primary font-bold' : 'text-white/40'}
                `}
              >
                Password
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 btn btn-primary text-white font-black tracking-wide rounded-xl shadow-[0_0_25px_rgba(99,102,241,0.5)] hover:shadow-[0_0_35px_rgba(99,102,241,0.7)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 border-none"
            >
              Sign In
            </button>
          </form>

          <p className="mt-6 text-center text-white/50 text-xs">
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
