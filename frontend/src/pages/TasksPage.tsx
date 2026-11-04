import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { teamApi, taskApi, userApi } from '../api/axios';
import { useAuth } from '../context/useAuth';
import { Plus, Loader2, AlertCircle, LayoutGrid, ChevronDown, CheckCircle2, Clock, CircleDot, Filter, Search, X } from 'lucide-react';
import clsx from 'clsx';
import CreateTaskModal from '../components/CreateTaskModal';
import TaskDetailsModal from '../components/TaskDetailsModal';
import type { Team, Task, User } from '../types';

export default function TasksPage() {
  const { user } = useAuth();
  const [selectedTeamId, setSelectedTeamId] = useState<string>('ALL');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [columnSortOrders, setColumnSortOrders] = useState<Record<string, 'ASC' | 'DESC'>>({
    TODO: 'DESC',
    IN_PROGRESS: 'DESC',
    DONE: 'DESC'
  });

  // Fetch Teams
  const { data: teams, isLoading: teamsLoading } = useQuery<Team[]>({
    queryKey: ['teams', user?.role],
    queryFn: async () => {
      if (user?.role === 'ADMIN') {
        return (await teamApi.get('')).data;
      }
      return (await teamApi.get('/mine')).data;
    },
  });

  // Fetch Users for Name Lookup
  const { data: users } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => (await userApi.get('')).data,
  });

  const activeTeam = selectedTeamId === 'ALL' ? null : teams?.find((t: Team) => t._id === selectedTeamId);

  // Fetch Tasks for Team
  const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ['tasks', selectedTeamId],
    queryFn: async () => {
        if (selectedTeamId === 'ALL') {
            return (await taskApi.get('')).data;
        }
        return (await taskApi.get('', { params: { teamId: selectedTeamId } })).data;
    },
    enabled: !!selectedTeamId,
  });

  // Filtering Logic
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    
    return tasks.filter((task: Task) => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (task.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPriority = filterPriority === 'ALL' || task.priority === filterPriority;
      return matchesSearch && matchesPriority;
    });
  }, [tasks, searchTerm, filterPriority]);

  const columns = [
    { id: 'TODO', title: 'To Do', color: 'text-slate-500', bg: 'bg-slate-500/10', icon: CircleDot },
    { id: 'IN_PROGRESS', title: 'In Progress', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: Clock },
    { id: 'DONE', title: 'Completed', color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle2 }
  ];

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-['Inter'] overflow-hidden">
      
      <div className="bg-white dark:bg-slate-900 border-b border-base-200 dark:border-slate-800 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 z-20 shrink-0">
        <div className="flex items-center gap-4">
          <div className="relative">
            <button 
              onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
              className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 border border-base-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 hover:border-primary/50 transition-all font-['Outfit'] font-black text-sm tracking-tight"
            >
              <LayoutGrid size={16} className="text-primary" />
              <span>{activeTeam ? activeTeam.name : 'All Teams Tasks'}</span>
              <ChevronDown size={14} className={clsx("opacity-40 transition-transform duration-300", isSwitcherOpen && "rotate-180")} />
            </button>

            {isSwitcherOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsSwitcherOpen(false)} />
                <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-base-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest opacity-40">Filter View</div>
                  <button
                    onClick={() => { setSelectedTeamId('ALL'); setIsSwitcherOpen(false); }}
                    className={clsx(
                      "w-full text-left px-3 py-2.5 rounded-xl font-bold text-xs transition-all",
                      selectedTeamId === 'ALL' ? "bg-primary/10 text-primary" : "hover:bg-slate-50 dark:hover:bg-slate-800 opacity-60"
                    )}
                  >
                    All Teams
                  </button>
                  <div className="h-px bg-base-100 dark:bg-slate-800 my-1" />
                  <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest opacity-40">My Teams</div>
                  <div className="max-h-48 overflow-y-auto no-scrollbar space-y-1">
                    {teamsLoading ? (
                      <div className="p-4 flex justify-center"><Loader2 className="animate-spin opacity-20" size={16} /></div>
                    ) : teams?.map((t: Team) => (
                      <button
                        key={t._id}
                        onClick={() => { setSelectedTeamId(t._id); setIsSwitcherOpen(false); }}
                        className={clsx(
                          "w-full text-left px-3 py-2.5 rounded-xl font-bold text-xs truncate transition-all",
                          selectedTeamId === t._id ? "bg-primary/10 text-primary" : "hover:bg-slate-50 dark:hover:bg-slate-800 opacity-60"
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

          <div className="h-6 w-px bg-base-200 dark:border-slate-800 hidden md:block" />

          <div className="relative flex-1 md:w-64">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-30" />
            <input 
              type="text" 
              placeholder="Filter tasks..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-base-200 dark:border-slate-800 rounded-xl py-2 pl-9 pr-8 text-xs font-bold outline-none focus:border-primary transition-all"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-30 hover:opacity-100">
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-50 dark:bg-slate-950 border border-base-200 dark:border-slate-800 rounded-xl p-1 gap-1">
             {(['ALL', 'LOW', 'MEDIUM', 'HIGH'] as const).map(p => (
               <button
                 key={p}
                 onClick={() => setFilterPriority(p)}
                 className={clsx(
                   "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all",
                   filterPriority === p ? "bg-white dark:bg-slate-800 text-primary shadow-sm" : "opacity-40 hover:opacity-100"
                 )}
               >
                 {p}
               </button>
             ))}
          </div>

          {user?.role === 'TEAM_LEADER' && (
            <button 
              onClick={() => setIsCreateOpen(true)}
              className="btn btn-primary rounded-xl px-4 py-2 h-auto min-h-0 font-['Outfit'] font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 gap-1.5"
            >
              <Plus size={14} /> New Task
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 md:p-10 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-[1600px] mx-auto h-full flex gap-8 min-w-[1100px]">
          {columns.map((col) => {
            const currentSortOrder = columnSortOrders[col.id] || 'DESC';
            const colTasks = filteredTasks
              .filter((t: Task) => t.status === col.id)
              .sort((a: Task, b: Task) => {
                const dateA = new Date(a.createdAt).getTime();
                const dateB = new Date(b.createdAt).getTime();
                return currentSortOrder === 'ASC' ? dateA - dateB : dateB - dateA;
              });

            const ColIcon = col.icon;
            const totalInCol = tasks?.filter((t: Task) => t.status === col.id).length || 0;

            return (
              <div key={col.id} className="flex-1 flex flex-col min-w-0 h-full">
                
                <div className="flex items-center justify-between px-2 mb-6 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className={clsx("w-8 h-8 rounded-xl flex items-center justify-center border border-current border-opacity-20", col.color, col.bg)}>
                        <ColIcon size={16} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black font-['Outfit'] uppercase tracking-[0.2em] opacity-80">{col.title}</h3>
                        <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest">{colTasks.length} Tasks</p>
                    </div>
                  </div>
                  <div className="relative group/filter">
                    <button 
                        onClick={() => setColumnSortOrders(prev => ({
                          ...prev,
                          [col.id]: prev[col.id] === 'ASC' ? 'DESC' : 'ASC'
                        }))}
                        className={clsx(
                            "btn btn-ghost btn-circle btn-xs transition-all",
                            currentSortOrder === 'DESC' 
                                ? "opacity-60 text-base-content" 
                                : "opacity-20 hover:opacity-100"
                        )}
                    >
                        <Filter size={14} />
                    </button>
                    
                    <div className="absolute bottom-full right-0 mb-2 invisible group-hover/filter:visible bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg whitespace-nowrap shadow-xl">
                        {colTasks.length} out of {totalInCol} ({currentSortOrder === 'ASC' ? 'Ascending' : 'Descending'})
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar space-y-5 pr-2 pb-10">
                  {tasksLoading ? (
                      <div className="py-20 flex justify-center"><Loader2 className="animate-spin opacity-20" size={24} /></div>
                  ) : colTasks.map((task: Task) => {
                    const isDone = task.status === 'DONE';
                    const deadline = task.deadline ? new Date(task.deadline) : null;
                    const today = new Date();
                    today.setHours(0,0,0,0);
                    const isOverdue = !isDone && deadline && deadline < today;

                    return (
                        <div 
                          key={task._id} 
                          onClick={() => setActiveTaskId(task._id)}
                          className={clsx(
                            "group bg-white dark:bg-slate-900 rounded-[1.5rem] p-6 border border-base-200 dark:border-slate-800 transition-all cursor-pointer hover:shadow-2xl hover:shadow-black/5 hover:border-primary",
                            isOverdue && "border-rose-500/30 bg-rose-500/5"
                          )}
                        >
                          <div className="flex flex-col gap-4">
                            <div className="flex items-start justify-between gap-4">
                                <h4 className="text-base font-black font-['Outfit'] tracking-tight leading-tight group-hover:text-primary transition-colors">
                                    {task.title}
                                </h4>
                                <div className={clsx(
                                    "px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border border-current border-opacity-20 shrink-0",
                                    task.priority === 'HIGH' ? 'text-rose-500 bg-rose-500/10' : 
                                    task.priority === 'MEDIUM' ? 'text-amber-500 bg-amber-500/10' : 
                                    'text-emerald-500 bg-emerald-500/10'
                                )}>
                                    {task.priority}
                                </div>
                            </div>

                            <div 
                                className="text-xs opacity-50 font-medium truncate leading-relaxed"
                                dangerouslySetInnerHTML={{ 
                                    __html: task.description 
                                        ? task.description
                                            .replace(/<\/?(p|h[1-6]|li|blockquote|div|ul|ol)[^>]*>/gm, ' ')
                                            .replace(/<(?!(\/?(strong|b|em|i|u))\b)[^>]+>/gm, '')
                                            .trim()
                                            .replace(/\s+/g, ' ')
                                        : "System protocol standard. No documentation provided."
                                }}
                            />

                            <div className="pt-4 border-t border-base-100 dark:border-slate-800 flex items-center justify-between">
                                <div className={clsx(
                                    "flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase",
                                    isOverdue ? "text-rose-500" : "opacity-30"
                                )}>
                                    {isOverdue && <AlertCircle size={10} />}
                                    {deadline ? deadline.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No Shelf Life'}
                                </div>
                                
                                <div className="flex -space-x-2">
                                    {task.assigneeIds?.slice(0, 3).map((id: number, i: number) => {
                                        const memberUser = users?.find((u: User) => u.id === id);
                                        const name = memberUser?.fullName || 'U';
                                        return (
                                          <div key={i} title={name} className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[8px] font-black opacity-60">
                                              {name[0].toUpperCase()}
                                          </div>
                                        );
                                    })}
                                    {(task.assigneeIds?.length || 0) > 3 && (
                                        <div className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 bg-primary flex items-center justify-center text-[8px] font-black">
                                            +{task.assigneeIds.length - 3}
                                        </div>
                                    )}
                                </div>
                            </div>
                          </div>
                        </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <CreateTaskModal 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        teamId={selectedTeamId} 
      />

      {activeTaskId && (
        <TaskDetailsModal 
          taskId={activeTaskId} 
          isOpen={!!activeTaskId} 
          onClose={() => setActiveTaskId(null)} 
        />
      )}
    </div>
  );
}
