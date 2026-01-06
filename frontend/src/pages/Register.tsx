import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useState } from 'react';

export default function Register() {
  const { register: registerUser } = useAuth();
  const { register, handleSubmit } = useForm();
  const navigate = useNavigate();
  const [focused, setFocused] = useState<Record<string, boolean>>({});

  const onSubmit = async (data: any) => {
    try {
      await registerUser(data);
      toast.success('Registered successfully. Awaiting admin approval.');
      navigate('/login');
    } catch {
      toast.error('Email already exists');
    }
  };

  const handleFocus = (name: string) =>
    setFocused((p) => ({ ...p, [name]: true }));

  const handleBlur = (name: string, value: string) =>
    setFocused((p) => ({ ...p, [name]: value !== '' }));

  return (
    <div className="w-screen min-h-screen flex items-center justify-center bg-base-200">
      <div className="w-full max-w-md p-10 bg-slate-100 dark:bg-slate-900 rounded-3xl shadow-xl border border-base-300">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-extrabold text-primary">Create Account</h1>
          <p className="mt-2 text-base-content/60 text-sm">Admin approval required</p>
        </div>

        <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>
          <div className="relative">
            <input
              type="text"
              {...register('fullName')}
              placeholder=" "
              onFocus={() => handleFocus('fullName')}
              onBlur={(e) => handleBlur('fullName', e.target.value)}
              className="w-full border-b-2 border-base-300 focus:border-primary outline-none py-3 px-1 transition-colors bg-slate-100 dark:bg-slate-900 text-base-content"
            />
            <label
              className={`absolute left-1 top-3 text-sm transition-all
                ${focused.fullName ? '-translate-y-5 text-xs text-primary font-semibold' : 'text-base-content/40'}
              `}
            >
              Full Name
            </label>
          </div>

          <div className="relative">
            <input
              type="email"
              {...register('email')}
              placeholder=" "
              onFocus={() => handleFocus('email')}
              onBlur={(e) => handleBlur('email', e.target.value)}
              className="w-full border-b-2 border-base-300 focus:border-primary outline-none py-3 px-1 transition-colors bg-slate-100 dark:bg-slate-900 text-base-content"
            />
            <label
              className={`absolute left-1 top-3 text-sm transition-all
                ${focused.email ? '-translate-y-5 text-xs text-primary font-semibold' : 'text-base-content/40'}
              `}
            >
              Email
            </label>
          </div>

          <div className="relative">
            <input
              type="password"
              {...register('password')}
              placeholder=" "
              onFocus={() => handleFocus('password')}
              onBlur={(e) => handleBlur('password', e.target.value)}
              className="w-full border-b-2 border-base-300 focus:border-primary outline-none py-3 px-1 transition-colors bg-slate-100 dark:bg-slate-900 text-base-content"
            />
            <label
              className={`absolute left-1 top-3 text-sm transition-all
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
            Register
          </button>
        </form>

        <p className="mt-6 text-center text-base-content/60 text-sm">
          Already have an account?{' '}
          <a href="/login" className="text-primary font-semibold hover:underline">
            Login
          </a>
        </p>
      </div>
    </div>
  );
}
