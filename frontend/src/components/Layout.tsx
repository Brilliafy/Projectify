import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, ShieldAlert, LogOut, CheckSquare, ChevronRight } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import clsx from 'clsx';
import ProjectifyIcon from '../assets/icon.webp';

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/teams', label: 'My Teams', icon: Users },
    { to: '/tasks', label: 'All Tasks', icon: CheckSquare },
  ];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-['Inter'] overflow-hidden">
      
      <aside 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={clsx(
          "relative h-full bg-white dark:bg-slate-900 border-r border-base-200 dark:border-slate-800 flex flex-col transition-all duration-500 ease-in-out z-50 shadow-xl shadow-black/5",
          isHovered ? "w-72" : "w-20"
        )}
      >
        
        <div className="h-24 flex items-center overflow-hidden shrink-0">
          <div className="w-20 flex-none flex items-center justify-center">
            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 shadow-xl overflow-hidden flex items-center justify-center p-1.5 border border-base-100 dark:border-slate-700">
               <img src={ProjectifyIcon} alt="Logo" className="w-full h-full object-contain" />
            </div>
          </div>
          <span className={clsx(
            "font-['Outfit'] font-black text-2xl tracking-tighter transition-all duration-300 whitespace-nowrap",
            isHovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
          )}>
            Projectify<span className="text-primary">.</span>
          </span>
        </div>

        
        <nav className="flex-1 py-4 space-y-2 overflow-y-auto no-scrollbar overflow-x-hidden">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            const Icon = item.icon;
            
            return (
              <div key={item.to} className="px-2">
                <Link 
                  to={item.to} 
                  className={clsx(
                    "group flex items-center h-12 rounded-2xl transition-all duration-300 relative overflow-hidden",
                    isActive 
                      ? "bg-primary/5 text-primary" 
                      : "text-base-content/40 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800"
                  )}
                >
                  
                  <div className="w-16 h-12 flex-none flex items-center justify-center">
                    <Icon size={20} className={clsx("transition-transform duration-300", isActive ? "scale-110 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" : "group-hover:scale-110")} />
                  </div>
                  
                  <span className={clsx(
                    "font-bold text-sm whitespace-nowrap transition-all duration-300",
                    isHovered ? "opacity-100 translate-x-1" : "opacity-0 -translate-x-4",
                    isActive && "animate-text-glow font-black"
                  )}>
                    {item.label}
                  </span>

                  {isActive && (
                      <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />
                  )}
                </Link>
              </div>
            );
          })}

          {user?.role === 'ADMIN' && (
            <div className="pt-4 mt-4 border-t border-base-100 dark:border-slate-800 px-2">
               <Link 
                to="/admin" 
                className={clsx(
                  "group flex items-center h-12 rounded-2xl transition-all duration-300 text-rose-500/60 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10",
                  location.pathname === '/admin' && "bg-rose-500/10 text-rose-500"
                )}
              >
                <div className="w-16 h-12 flex-none flex items-center justify-center">
                  <ShieldAlert size={20} />
                </div>
                <span className={clsx(
                  "font-bold text-sm whitespace-nowrap transition-all duration-300",
                  isHovered ? "opacity-100 translate-x-1" : "opacity-0 -translate-x-4",
                  location.pathname === '/admin' && "animate-text-glow brightness-125 font-black text-rose-500"
                )}>
                  Admin Console
                </span>
              </Link>
            </div>
          )}
        </nav>


        
        <div className="py-4 border-t border-base-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="px-2">
            <div className={clsx(
              "flex items-center h-12 transition-all duration-300 overflow-hidden",
              isHovered ? "bg-slate-50 dark:bg-slate-800/50 rounded-2xl" : ""
            )}>
              <div className="w-16 h-12 flex-none flex items-center justify-center">
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black border border-primary/20 shrink-0">
                  {user?.fullName?.[0] || 'U'}
                </div>
              </div>
              
              <div className={clsx(
                "flex-1 min-w-0 transition-all duration-300",
                isHovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
              )}>
                <p className="text-[11px] font-black truncate leading-tight">{user?.fullName}</p>
                <p className="text-[9px] font-bold opacity-30 truncate uppercase tracking-widest">{user?.role?.replace('_', ' ')}</p>
              </div>
            </div>
          </div>

          <div className="mt-2 px-2">
            <button 
                onClick={handleLogout} 
                className="flex items-center h-12 w-full rounded-2xl transition-all duration-300 hover:bg-rose-500/5 text-base-content/40 hover:text-rose-500 group overflow-hidden !p-0 !bg-transparent !border-none"
            >
                <div className="w-16 h-12 flex-none flex items-center justify-center">
                   <LogOut size={20} className="group-hover:-translate-x-0.5 transition-all duration-300 group-hover:text-rose-500 group-hover:drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                </div>
                <div className={clsx(
                  "flex-1 whitespace-nowrap overflow-hidden transition-all duration-300",
                  isHovered ? "opacity-100 translate-x-0 max-w-xs" : "opacity-0 -translate-x-4 max-w-0"
                )}>
                  <span className="font-black text-[10px] uppercase tracking-[0.2em] group-hover:animate-logout-glow">
                      Logout
                  </span>
                </div>
            </button>
          </div>
        </div>


        
        {!isHovered && (
            <div className="absolute top-1/2 -right-3 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-base-200 dark:border-slate-700 flex items-center justify-center shadow-md animate-bounce-x pointer-events-none">
                <ChevronRight size={10} className="opacity-30" />
            </div>
        )}
      </aside>


      
      <main className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 overflow-y-auto no-scrollbar scroll-smooth">
            {children}
        </div>
      </main>
    </div>
  );
}