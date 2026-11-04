import { useForm } from 'react-hook-form';
import { useAuth } from '../context/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useState } from 'react';
import axios from 'axios';
import type { RegisterData } from '../types';

export default function Register() {
  const { register: registerUser } = useAuth();
  const { register, handleSubmit } = useForm<RegisterData>();
  const navigate = useNavigate();
  const [focused, setFocused] = useState<Record<string, boolean>>({});

  const onSubmit = async (data: RegisterData) => {
    try {
      await registerUser(data);
      toast.success('Registered successfully! Awaiting admin approval before login.');
      navigate('/login');
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        toast.error(err.response.data.error);
      } else {
        toast.error('Registration failed. Email may already exist.');
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
      <div className="absolute -top-28 -right-28 w-[540px] h-[540px] rounded-full bg-gradient-to-tr from-indigo-300/40 to-purple-300/35 blur-[110px] animate-aurora-1 pointer-events-none"></div>

      {/* Orb 2: Sky / Cyan Vibrant Sheen */}
      <div className="absolute -bottom-32 -left-32 w-[580px] h-[580px] rounded-full bg-gradient-to-br from-sky-300/40 to-cyan-200/45 blur-[120px] animate-aurora-2 pointer-events-none"></div>

      {/* Orb 3: Peach / Rose Warm Ambient Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full bg-gradient-to-r from-rose-200/35 via-pink-200/30 to-amber-200/35 blur-[100px] animate-aurora-3 pointer-events-none"></div>

      {/* Card with Cool Animated Border Beam (Light Mode) */}
      <div className="w-full max-w-md border-beam-card shadow-2xl z-10 transition-transform">
        <div className="border-beam-inner p-8 sm:p-10 border border-white/80 text-slate-800">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black font-['Outfit'] tracking-tight text-slate-900">
              Create Account<span className="text-primary">.</span>
            </h1>
            <p className="mt-2 text-xs text-slate-500 tracking-wide font-medium">
              Demo sandbox: admin approval simulated
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="relative">
              <input
                type="text"
                {...register('fullName', { required: true })}
                placeholder=" "
                onFocus={() => handleFocus('fullName')}
                onBlur={(e) => handleBlur('fullName', e.target.value)}
                className="peer w-full bg-slate-50/90 border-b-2 border-slate-300 focus:border-primary outline-none py-3 px-3 rounded-t-xl transition-all text-slate-900 placeholder-transparent text-sm focus:bg-white"
              />
              <label
                className={`absolute left-3 top-3 text-sm transition-all pointer-events-none
                  ${focused.fullName ? '-translate-y-6 text-xs text-primary font-bold' : 'text-slate-400'}
                `}
              >
                Full Name
              </label>
            </div>

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
                {...register('password', { required: true, minLength: 6 })}
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
                Password (min 6 chars)
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 btn btn-primary text-white font-black tracking-wide rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 border-none"
            >
              Register
            </button>
          </form>

          <p className="mt-6 text-center text-slate-500 text-xs">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-bold hover:underline transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
