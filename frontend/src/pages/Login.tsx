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
    } catch {
      toast.error('Quick login failed');
    }
  };

  const handleFocus = (name: string) =>
    setFocused((p) => ({ ...p, [name]: true }));

  const handleBlur = (name: string, value: string) =>
    setFocused((p) => ({ ...p, [name]: value !== '' }));

  return (
    <div className="w-screen min-h-screen flex items-center justify-center bg-base-200 p-4">
      <div className="w-full max-w-md p-8 sm:p-10 bg-slate-100 dark:bg-slate-900 rounded-3xl shadow-xl border border-base-300">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-lg overflow-hidden flex items-center justify-center p-2 border border-base-200 dark:border-slate-700 mx-auto mb-3">
            <img src={ProjectifyIcon} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-4xl font-extrabold text-primary">Projectify</h1>
          <p className="mt-1 text-base-content/60 text-sm">Interactive Showcase Demo</p>
        </div>

        {/* 1-Click Demo Login Personas */}
        <div className="mb-6 p-4 rounded-2xl bg-primary/10 border border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-primary">
              ⚡ 1-Click Demo Access
            </span>
            <span className="badge badge-sm badge-primary font-bold">Offline Storage</span>
          </div>
          <p className="text-xs text-base-content/60 mb-3">
            Choose a persona to explore the app with ready-made data:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => quickLogin('admin@projectify.com')}
              className="btn btn-sm btn-outline btn-primary rounded-xl text-xs font-bold py-1.5 h-auto flex flex-col items-center transition-transform hover:scale-105"
            >
              <span>👑 Admin</span>
              <span className="text-[10px] font-normal opacity-80">Full Control</span>
            </button>
            <button
              type="button"
              onClick={() => quickLogin('leader@projectify.com')}
              className="btn btn-sm btn-outline btn-primary rounded-xl text-xs font-bold py-1.5 h-auto flex flex-col items-center transition-transform hover:scale-105"
            >
              <span>🚀 Leader</span>
              <span className="text-[10px] font-normal opacity-80">Task Creator</span>
            </button>
            <button
              type="button"
              onClick={() => quickLogin('sarah@projectify.com')}
              className="btn btn-sm btn-outline btn-primary rounded-xl text-xs font-bold py-1.5 h-auto flex flex-col items-center transition-transform hover:scale-105"
            >
              <span>💻 Member</span>
              <span className="text-[10px] font-normal opacity-80">Executor</span>
            </button>
          </div>
        </div>

        <div className="divider text-xs text-base-content/40 mb-6">OR SIGN IN MANUALLY</div>

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="relative">
            <input
              type="email"
              {...register('email', { required: true })}
              placeholder=" "
              onFocus={() => handleFocus('email')}
              onBlur={(e) => handleBlur('email', e.target.value)}
              className="peer w-full border-b-2 border-base-300 focus:border-primary outline-none py-2.5 px-1 transition-colors bg-slate-100 dark:bg-slate-900 text-base-content"
            />
            <label
              className={`absolute left-1 top-2.5 text-sm transition-all
                ${focused.email ? '-translate-y-5 text-xs text-primary font-semibold' : 'text-base-content/40'}
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
              className="peer w-full border-b-2 border-base-300 focus:border-primary outline-none py-2.5 px-1 transition-colors bg-slate-100 dark:bg-slate-900 text-base-content"
            />
            <label
              className={`absolute left-1 top-2.5 text-sm transition-all
                ${focused.password ? '-translate-y-5 text-xs text-primary font-semibold' : 'text-base-content/40'}
              `}
            >
              Password
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-3 btn btn-primary text-primary-content font-bold rounded-xl shadow-lg hover:scale-[1.02] transition-transform"
          >
            Login
          </button>
        </form>

        <p className="mt-6 text-center text-base-content/60 text-sm">
          No account?{' '}
          <Link to="/register" className="text-primary font-semibold hover:underline">
            Register Demo User
          </Link>
        </p>
      </div>
    </div>
  );
}
