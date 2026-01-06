import { useQuery } from '@tanstack/react-query';
import { taskApi, teamApi, userApi } from '../api/axios';
import { CircleDot, CheckCircle2, Clock, Plus, Users, Shield, LayoutGrid, AlertCircle, ChevronDown, Bell, Check, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useState, useMemo } from 'react';
import CreateTaskModal from '../components/CreateTaskModal';
import TaskStats from '../components/TaskStats';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

export default function Dashboard() {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotifications } = useNotifications();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('ALL');

  // 1. Fetch my teams
  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => (await teamApi.get('/mine')).data
  });

  const activeTeam = useMemo(() => 
    selectedTeamId === 'ALL' ? null : teams?.find((t: any) => t._id === selectedTeamId),
    [teams, selectedTeamId]
  );
  
  // 2. Fetch tasks
  const { data: allTasks, isLoading } = useQuery({
    queryKey: ['tasks', 'dashboard', teams?.map((t: any) => t._id)],
    queryFn: async () => {
        const promises = teams.map((t: any) => taskApi.get('', { params: { teamId: t._id } }));
        const results = await Promise.all(promises);
        return results.flatMap(r => r.data);
    },
    enabled: !!teams && teams.length > 0
  });

  const tasks = useMemo(() => {
    if (!allTasks) return [];
    if (selectedTeamId === 'ALL') return allTasks;
    return allTasks.filter((t: any) => t.teamId === selectedTeamId);
  }, [allTasks, selectedTeamId]);

  // 3. Fetch Users for creator names
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await userApi.get('')).data,
    enabled: !!tasks
  });

  const getCreatorName = (id: number) => {
    return users?.find((u: any) => u.id === id)?.fullName || `User ${id}`;
  };

  const getStatusInfo = (status: string, isOverdue: boolean, isDueToday: boolean) => {
    if (isOverdue) return { icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-500/10', label: 'Overdue' };
    if (isDueToday) return { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Due Today' };

    switch(status) {
        case 'DONE': return { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Completed' };
        case 'IN_PROGRESS': return { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'In Progress' };
        default: return { icon: CircleDot, color: 'text-slate-400', bg: 'bg-slate-500/10', label: 'To Do' };
    }
  };

  const handleNotificationClick = (notif: any) => {
    markAsRead(notif._id);
    setIsNotificationsOpen(false);
    
    // Navigate based on type
    if (notif.relatedId && (notif.type === 'TASK_ASSIGNED' || notif.type === 'TASK_UPDATED' || notif.type === 'COMMENT_ADDED')) {
        navigate(`/task/${notif.relatedId}`);
    } else if (notif.type === 'TEAM_ADDED') {
        navigate('/teams');
    }
  };

  if (!user) return <div className="flex h-screen items-center justify-center font-bold text-xl">Please Log in</div>;
  
  if (teams && teams.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-[70vh] gap-6 text-center px-4">
            <div className="p-6 bg-primary/10 rounded-full text-primary animate-pulse">
                <Users size={64} />
            </div>
            <div>
                <h2 className="text-3xl font-black tracking-tight mb-2">Ready to start?</h2>
                <p className="opacity-60 max-w-md mx-auto">You're not currently part of any team. Join or create a team to start managing tasks.</p>
            </div>
            <button onClick={() => navigate('/teams')} className="btn btn-primary btn-lg px-8 rounded-full shadow-lg shadow-primary/20">
                Go to Teams
            </button>
        </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-4 flex-1 w-full">
          <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-[0.2em] text-[10px] opacity-60 font-['Inter']">
                <LayoutGrid size={12} /> Dashboard Context
              </div>

             
             {user?.role !== 'ADMIN' && (
                <div className="relative z-50">
                    <button 
                        onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                        className="relative group flex items-center gap-2 transition-all hover:text-primary"
                    >
                        <div className={clsx("p-1.5 rounded-lg transition-colors", isNotificationsOpen ? "bg-primary/20 text-primary" : "bg-transparent text-base-content/40 group-hover:bg-primary/10")}>
                            <Bell size={16} />
                        </div>
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-950 animate-in zoom-in duration-300">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {isNotificationsOpen && (
                        <>
                            <div className="fixed inset-0 z-[90]" onClick={() => setIsNotificationsOpen(false)} />
                            <div className="absolute top-full left-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 shadow-2xl rounded-2xl border border-base-200 dark:border-slate-800 z-[100] animate-in fade-in zoom-in-95 duration-200 origin-top-left overflow-hidden">
                                <div className="p-4 border-b border-base-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm">
                                    <h4 className="font-bold text-xs uppercase tracking-widest opacity-70">Notifications</h4>
                                    <div className="flex gap-2">
                                        {unreadCount > 0 && (
                                            <button onClick={markAllAsRead} className="btn btn-xs btn-ghost gap-1 text-[10px] h-7 font-bold text-primary hover:bg-primary/10">
                                                <Check size={12} /> Mark read
                                            </button>
                                        )}
                                        {notifications.length > 0 && (
                                            <button onClick={deleteNotifications} className="btn btn-xs btn-ghost btn-square w-7 h-7 text-rose-500 hover:bg-rose-500/10 !p-0 justify-center flex items-center">
                                                <Trash2 size={12} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="max-h-[60vh] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                                    {notifications.length === 0 ? (
                                        <div className="p-8 text-center opacity-40">
                                            <Bell size={32} className="mx-auto mb-3 opacity-20" />
                                            <p className="text-xs font-semibold">No notifications</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-base-200 dark:divide-slate-800">
                                            {notifications.map((n) => (
                                                <div 
                                                    key={n._id} 
                                                    onClick={() => handleNotificationClick(n)}
                                                    className={clsx(
                                                        "p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer flex gap-3 group relative",
                                                        !n.read && "bg-primary/5"
                                                    )}
                                                >
                                                    {!n.read && (
                                                        <span className="absolute left-0 top-6 w-0.5 h-8 bg-primary rounded-r-full" />
                                                    )}
                                                    <div className={clsx(
                                                        "mt-1 w-2 h-2 rounded-full shrink-0",
                                                        !n.read ? "bg-primary" : "bg-slate-300 dark:bg-slate-700"
                                                    )} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className={clsx("text-xs leading-relaxed", !n.read ? "font-semibold text-base-content" : "text-base-content/60")}>
                                                            {n.message}
                                                        </p>
                                                        <span className="text-[10px] text-base-content/30 font-medium mt-1 block">
                                                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
             )}
          </div>
          
          <div className="flex items-center gap-4">
             <div className="flex flex-col">
                <h1 className="text-5xl font-black tracking-tighter font-['Outfit'] leading-none">
                  {selectedTeamId === 'ALL' ? 'General' : activeTeam?.name} Board
                  <span className="text-primary">.</span>
                </h1>
                <p className="text-sm opacity-40 flex items-center gap-2 mt-2 font-['Inter'] font-medium">
                  {selectedTeamId === 'ALL' ? `${teams?.length} Teams Syncing` : `${activeTeam?.members?.length || 0} Members Productive`}
                </p>
             </div>

             <div className="relative">
                <button 
                    onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
                    className={clsx(
                        "group flex items-center gap-2 px-3 py-1.5 transition-all rounded-lg cursor-pointer border",
                        isSwitcherOpen 
                            ? "bg-primary text-violet-500 border-primary shadow-lg shadow-primary/20" 
                            : "bg-white dark:bg-slate-800 border-base-200 dark:border-slate-700 hover:border-primary/50 text-base-content/60 hover:text-primary"
                    )}
                >
                    <LayoutGrid size={12} className={clsx(isSwitcherOpen ? "opacity-100" : "opacity-40 group-hover:opacity-100")} />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] font-['Inter']">Context</span>
                    <ChevronDown size={12} className={clsx("transition-transform duration-200", isSwitcherOpen && "rotate-180")} />
                </button>

                {isSwitcherOpen && (
                    <>
                        <div className="fixed inset-0 z-[90]" onClick={() => setIsSwitcherOpen(false)} />
                        <div className="absolute top-full left-0 mt-2 w-64 p-2 bg-white dark:bg-slate-900 shadow-2xl rounded-2xl border border-base-200 dark:border-slate-800 z-[100] animate-in fade-in zoom-in-95 duration-200 origin-top-left">
                            <div className="px-3 py-2">
                                <span className="text-[9px] uppercase tracking-[0.2em] font-black opacity-30 font-['Inter']">Select Context</span>
                            </div>
                            <div className="space-y-1">
                                <button 
                                    onClick={() => { setSelectedTeamId('ALL'); setIsSwitcherOpen(false); }} 
                                    className={clsx(
                                        "w-full text-left rounded-xl px-4 py-3 font-bold text-sm transition-all", 
                                        selectedTeamId === 'ALL' 
                                            ? "bg-primary/10 text-primary" 
                                            : "hover:bg-slate-100 dark:hover:bg-slate-800 text-base-content/70"
                                    )}
                                >
                                    Overview Board
                                </button>
                                <div className="h-px bg-base-200 dark:bg-slate-800 my-1 mx-2" />
                                {teams?.map((t: any) => (
                                    <button 
                                        key={t._id}
                                        onClick={() => { setSelectedTeamId(t._id); setIsSwitcherOpen(false); }} 
                                        className={clsx(
                                            "w-full text-left rounded-xl px-4 py-3 font-bold text-sm transition-all", 
                                            selectedTeamId === t._id 
                                                ? "bg-primary/10 text-primary" 
                                                : "hover:bg-slate-100 dark:hover:bg-slate-800 text-base-content/70"
                                        )}
                                    >
                                        {t.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}
             </div>
          </div>
        </div>
        
        {user?.role === 'TEAM_LEADER' && selectedTeamId !== 'ALL' && (
            <button 
                onClick={() => setIsModalOpen(true)} 
                className="btn btn-primary gap-2 rounded-xl shadow-lg shadow-primary/30 px-6 py-2 w-full md:w-auto font-['Outfit'] font-black uppercase tracking-widest text-[11px]"
            >
                <Plus size={18} /> New Task
            </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        
        <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between px-2">
                <h3 className="font-bold flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] opacity-50 font-['Inter']">
                    {selectedTeamId === 'ALL' ? 'Across All Teams' : 'Recent Activity'}
                    <span className="badge badge-sm badge-neutral rounded-md font-mono scale-90">{tasks?.length || 0}</span>
                </h3>
            </div>

            <div className="space-y-3">
                {isLoading ? (
                    <div className="py-20 flex justify-center"><span className="loading loading-spinner loading-lg text-primary"></span></div>
                ) : (
                    <>
                        {tasks?.length === 0 && (
                            <div className="bg-slate-100 dark:bg-slate-900/50 rounded-2xl p-12 text-center border-2 border-dashed border-base-300">
                                <p className="opacity-50 font-medium">No tasks found.</p>
                                {selectedTeamId !== 'ALL' && (
                                    <button onClick={() => setIsModalOpen(true)} className="mt-4 text-primary font-bold text-sm hover:underline">Create your first task →</button>
                                )}
                            </div>
                        )}
                        {tasks?.map((task: any) => {
                            const isDone = task.status === 'DONE';
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const deadline = task.deadline ? new Date(task.deadline) : null;
                            const isOverdue = !isDone && deadline && deadline < today;
                            const isDueToday = !isDone && deadline && deadline.getTime() === today.getTime();

                            const { icon: StatusIcon, color, bg, label } = getStatusInfo(task.status, !!isOverdue, !!isDueToday);
                            const taskTeam = teams?.find((t: any) => t._id === task.teamId);

                            return (
                                <div 
                                    key={task._id} 
                                    onClick={() => navigate(`/task/${task._id}`)}
                                    className={clsx(
                                        "group relative bg-white dark:bg-slate-900 rounded-2xl p-5 border transition-all cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1",
                                        isOverdue ? "border-rose-500/40 hover:border-rose-500" : "border-base-200 dark:border-slate-800 hover:border-primary"
                                    )}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={clsx("p-3 rounded-xl shrink-0 transition-transform group-hover:scale-110", bg, color)}>
                                            <StatusIcon size={22} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                <h4 className={clsx(
                                                    "font-bold truncate text-[17px] transition-colors font-['Outfit'] tracking-tight",
                                                    isOverdue ? "text-rose-600 dark:text-rose-400" : "group-hover:text-primary"
                                                )}>{task.title}</h4>
                                                <div className={clsx(
                                                    "badge badge-xs font-black uppercase tracking-[0.1em] px-2 py-2 rounded-md border text-[8px] font-['Inter']",
                                                    task.priority === 'HIGH' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 
                                                    task.priority === 'MEDIUM' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                                                    'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                                )}>
                                                    {task.priority}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.05em] opacity-30 font-['Inter']">
                                                {selectedTeamId === 'ALL' && (
                                                    <span className="text-primary/70 font-black tracking-widest bg-primary/5 px-1.5 py-0.5 rounded">
                                                        {taskTeam?.name}
                                                    </span>
                                                )}
                                                <span>#{task._id.slice(-6)}</span>
                                                <span className="w-1 h-1 rounded-full bg-current opacity-40" />
                                                <span>{getCreatorName(task.creatorId)}</span>
                                                <span className="w-1 h-1 rounded-full bg-current opacity-40" />
                                                <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="hidden sm:block text-right">
                                            <div className={clsx("text-[10px] font-black uppercase tracking-widest", color)}>{label}</div>
                                            {task.deadline && (
                                                <div className={clsx(
                                                    "text-[10px] italic mt-1 font-medium",
                                                    isOverdue ? "text-rose-500 opacity-100 font-bold" : "opacity-40"
                                                )}>
                                                    {isOverdue && "EXPIRED • "}Due {new Date(task.deadline).toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </>
                )}
            </div>
        </div>

        
        <div className="lg:col-span-4 space-y-6">
            <TaskStats tasks={tasks || []} />
            
            <div className="card bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-2xl border-none overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-500">
                   <Shield size={120} />
                </div>
                <div className="card-body p-6 relative">
                    <div className="flex items-center gap-2 mb-4">
                       <div className="p-2 bg-white/10 rounded-lg"><Users size={18} /></div>
                       <h3 className="font-black tracking-tight font-['Outfit']">Context Overview</h3>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                            <span className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-40 block mb-1 font-['Inter']">
                                {selectedTeamId === 'ALL' ? 'Network Status' : 'Current Team'}
                            </span>
                            <div className="font-bold text-lg truncate font-['Outfit'] tracking-tight">
                                {selectedTeamId === 'ALL' ? 'Viewing Global Board' : activeTeam?.name}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                <span className="text-[9px] uppercase font-bold tracking-[0.2em] opacity-40 block mb-1 font-['Inter']">Role</span>
                                <div className="text-xs font-bold text-primary tracking-wide font-['Inter']">{user.role.replace('_', ' ')}</div>
                            </div>
                            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                <span className="text-[9px] uppercase font-bold tracking-[0.2em] opacity-40 block mb-1 font-['Inter']">Availability</span>
                                <div className="text-xs font-bold flex items-center gap-1 font-['Inter'] tracking-wide">Available</div>
                            </div>
                        </div>
                        
                        {selectedTeamId !== 'ALL' && activeTeam?.members && (
                            <div className="pt-2">
                                <span className="text-[9px] uppercase font-bold tracking-widest opacity-40 block mb-2">Team Sync</span>
                                <div className="flex -space-x-2">
                                    {activeTeam.members.slice(0, 5).map((mId: number, i: number) => (
                                        <div key={i} className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold">
                                            {getCreatorName(mId)[0]}
                                        </div>
                                    ))}
                                    {activeTeam.members.length > 5 && (
                                        <div className="w-8 h-8 rounded-full bg-primary border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold">
                                            +{activeTeam.members.length - 5}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

      </div>

      {isModalOpen && selectedTeamId !== 'ALL' && (
        <CreateTaskModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            teamId={selectedTeamId} 
        />
      )}
    </div>
  );
}