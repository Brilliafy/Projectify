import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useState } from 'react';

export default function Login() {
  const { register, handleSubmit } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [focused, setFocused] = useState<Record<string, boolean>>({});

  const onSubmit = async (data: any) => {
    try {
      await login(data);
      toast.success('Welcome back');
      navigate('/');
    } catch (err: any) {
      const status = err?.response?.status;

      if (status === 403) {
        toast.error('Your account is awaiting admin approval');
      } else {
        toast.error('Invalid email or password');
      }
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
          <h1 className="text-5xl font-extrabold text-primary">Projectify</h1>
          <p className="mt-2 text-base-content/60 text-sm">Sign in to continue</p>
        </div>

        <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>
          <div className="relative">
            <input
              type="email"
              {...register('email')}
              placeholder=" "
              onFocus={() => handleFocus('email')}
              onBlur={(e) => handleBlur('email', e.target.value)}
              className="peer w-full border-b-2 border-base-300 focus:border-primary outline-none py-3 px-1 transition-colors bg-slate-100 dark:bg-slate-900 text-base-content"
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
              className="peer w-full border-b-2 border-base-300 focus:border-primary outline-none py-3 px-1 transition-colors bg-slate-100 dark:bg-slate-900 text-base-content"
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
            Login
          </button>
        </form>

        <p className="mt-6 text-center text-base-content/60 text-sm">
          No account?{' '}
          <a href="/register" className="text-primary font-semibold hover:underline">
            Register
          </a>
        </p>
      </div>
    </div>
  );
}
