import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import ProjectifyIcon from '../assets/icon.webp';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-['Inter'] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 shadow-xl overflow-hidden flex items-center justify-center p-2.5 border border-base-200 dark:border-slate-800 mx-auto mb-6">
          <img src={ProjectifyIcon} alt="Logo" className="w-full h-full object-contain" />
        </div>

        <span className="text-sm font-black uppercase tracking-wider text-primary mb-2 block">
          404 Error
        </span>

        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
          Page Not Found
        </h1>

        <p className="text-base text-base-content/60 mb-8 leading-relaxed">
          The page you are looking for doesn't exist, has been removed, or is temporarily unavailable.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/dashboard"
            className="btn btn-primary rounded-xl px-6 w-full sm:w-auto text-white font-bold flex items-center justify-center gap-2"
          >
            <Home size={18} />
            Go to Dashboard
          </Link>
          <Link
            to="/"
            className="btn btn-ghost rounded-xl px-6 w-full sm:w-auto text-base-content/70 hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center gap-2"
          >
            <ArrowLeft size={18} />
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
