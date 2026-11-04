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
    <div className="w-screen min-h-screen flex items-center justify-center bg-[#070b14] relative overflow-hidden p-4 font-['Inter']">
      {/* Dynamic Animated Mesh Gradient Orbs */}
      <div className="absolute inset-0 dot-pattern-bg pointer-events-none opacity-40"></div>
      
      {/* Orb 1: Indigo / Violet Glow */}
      <div className="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full bg-gradient-to-tr from-indigo-600/35 to-violet-600/30 blur-[130px] animate-aurora-1 pointer-events-none"></div>

      {/* Orb 2: Cyan / Blue Sheen */}
      <div className="absolute -bottom-36 -left-36 w-[560px] h-[560px] rounded-full bg-gradient-to-br from-cyan-500/25 to-blue-700/30 blur-[140px] animate-aurora-2 pointer-events-none"></div>

      {/* Card with God-Tier Animated Border Beam */}
      <div className="w-full max-w-md border-beam-card shadow-[0_20px_70px_rgba(0,0,0,0.65)] z-10 transition-transform">
        <div className="border-beam-inner p-8 sm:p-10 border border-white/10 text-white">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black font-['Outfit'] tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-400 bg-clip-text text-transparent">
              Create Account
            </h1>
            <p className="mt-2 text-xs text-white/50 tracking-wide font-medium">
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
                className="peer w-full bg-white/[0.05] border-b-2 border-white/20 focus:border-primary outline-none py-3 px-3 rounded-t-xl transition-all text-white placeholder-transparent text-sm focus:bg-white/[0.08]"
              />
              <label
                className={`absolute left-3 top-3 text-sm transition-all pointer-events-none
                  ${focused.fullName ? '-translate-y-6 text-xs text-primary font-bold' : 'text-white/40'}
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
                {...register('password', { required: true, minLength: 6 })}
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
                Password (min 6 chars)
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 btn btn-primary text-white font-black tracking-wide rounded-xl shadow-[0_0_25px_rgba(99,102,241,0.5)] hover:shadow-[0_0_35px_rgba(99,102,241,0.7)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 border-none"
            >
              Register
            </button>
          </form>

          <p className="mt-6 text-center text-white/50 text-xs">
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
