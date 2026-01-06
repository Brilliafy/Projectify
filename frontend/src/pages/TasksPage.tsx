import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { teamApi, taskApi, userApi } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Plus, Loader2, AlertCircle, LayoutGrid, ChevronDown, CheckCircle2, Clock, CircleDot, Filter, Search, X } from 'lucide-react';
import clsx from 'clsx';
import CreateTaskModal from '../components/CreateTaskModal';
import TaskDetailsModal from '../components/TaskDetailsModal';

export default function TasksPage() {
  const { user } = useAuth();
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
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
  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ['teams', user?.role],
    queryFn: async () => {
      if (user?.role === 'ADMIN') {
        return (await teamApi.get('')).data;
      }
      return (await teamApi.get('/mine')).data;
    },
  });

  // Fetch Users for Name Lookup
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await userApi.get('')).data,
  });

  useEffect(() => {
    if (teams && teams.length > 0 && !selectedTeamId) {
      setSelectedTeamId('ALL');
    }
  }, [teams, selectedTeamId]);

  const activeTeam = selectedTeamId === 'ALL' ? null : teams?.find((t: any) => t._id === selectedTeamId);

  // Fetch Tasks for Team
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', selectedTeamId],
    queryFn: async () => {
        if (selectedTeamId === 'ALL') {
            return (await taskApi.get('')).data; // Fetch all tasks if ALL is selected
        }
        return (await taskApi.get('', { params: { teamId: selectedTeamId } })).data;
    },
    enabled: !!selectedTeamId,
  });

  // Filtering Logic (Sorting moved to columns)
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    
    return tasks.filter((task: any) => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (task.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPriority = filterPriority === 'ALL' || task.priority === filterPriority;
      return matchesSearch && matchesPriority;
    });
  }, [tasks, searchTerm, filterPriority]);

  const columns = [
    { id: 'TODO', title: 'Plan', icon: CircleDot, color: 'text-slate-500', bg: 'bg-slate-500/5' },
    { id: 'IN_PROGRESS', title: 'Active', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/5' },
    { id: 'DONE', title: 'Success', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
  ];

  if (teamsLoading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-['Inter']">
      
      
      <div className="p-6 md:p-10 border-b border-base-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-[0.2em] text-[10px] opacity-60">
              <LayoutGrid size={12} /> Execution Board
            </div>
            
            <div className="flex items-center gap-4">
               <div>
                  <h1 className="text-4xl md:text-5xl font-black font-['Outfit'] tracking-tighter leading-none mb-2">
                    <span className="animate-text-glow tracking-tighter">{selectedTeamId === 'ALL' ? 'All Teams' : activeTeam?.name || 'Loading'}</span> Tasks<span className="text-primary">.</span>
                  </h1>
                  <p className="text-sm opacity-40 font-medium whitespace-nowrap">
                      {filteredTasks.length} of {tasks?.length || 0} Deliverables Visualized
                  </p>
               </div>

               
               <div className="relative">
                  <button 
                      onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
                      className={clsx(
                          "group h-10 px-4 transition-all rounded-2xl flex items-center gap-2 border",
                          isSwitcherOpen 
                              ? "bg-primary text-violet-500 border-primary shadow-lg shadow-primary/20" 
                              : "bg-slate-50 dark:bg-slate-800 border-base-200 dark:border-slate-700 hover:border-primary/50 text-base-content/60"
                      )}
                  >
                      <LayoutGrid size={14} className={clsx(isSwitcherOpen ? "opacity-100" : "opacity-40")} />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] hidden sm:inline">Context</span>
                      <ChevronDown size={14} className={clsx("transition-transform duration-200", isSwitcherOpen && "rotate-180")} />
                  </button>

                  {isSwitcherOpen && (
                      <>
                          <div className="fixed inset-0 z-[100]" onClick={() => setIsSwitcherOpen(false)} />
                          <div className="absolute top-full left-0 mt-2 w-72 p-2 bg-white dark:bg-slate-900 shadow-2xl rounded-[2rem] border border-base-200 dark:border-slate-800 z-[110] animate-in fade-in zoom-in-95 duration-200 origin-top-left">
                              <div className="px-5 py-3 border-b border-base-100 dark:border-slate-800 mb-1">
                                  <span className="text-[10px] uppercase tracking-[0.2em] font-black opacity-30">Change Perspective</span>
                              </div>
                              <div className="max-h-64 overflow-y-auto no-scrollbar p-1 space-y-1">
                                  <button 
                                      onClick={() => { setSelectedTeamId('ALL'); setIsSwitcherOpen(false); }} 
                                      className={clsx(
                                          "w-full text-left rounded-2xl px-4 py-3 font-bold text-sm transition-all flex items-center justify-between", 
                                          selectedTeamId === 'ALL' 
                                              ? "bg-slate-50 dark:bg-slate-800/50" 
                                              : "hover:bg-slate-50 dark:hover:bg-slate-800/50 text-base-content/70"
                                      )}
                                  >
                                      <span className={clsx(selectedTeamId === 'ALL' && "animate-text-glow")}>
                                          All Teams
                                      </span>
                                      {selectedTeamId === 'ALL' && <CheckCircle2 size={14} className="text-primary" />}
                                  </button>
                                  {teams?.map((t: any) => (
                                      <button 
                                          key={t._id}
                                          onClick={() => { setSelectedTeamId(t._id); setIsSwitcherOpen(false); }} 
                                          className={clsx(
                                              "w-full text-left rounded-2xl px-4 py-3 font-bold text-sm transition-all flex items-center justify-between", 
                                              selectedTeamId === t._id 
                                                  ? "bg-slate-50 dark:bg-slate-800/50" 
                                                  : "hover:bg-slate-50 dark:hover:bg-slate-800/50 text-base-content/70"
                                          )}
                                      >
                                          <span className={clsx(selectedTeamId === t._id && "animate-text-glow")}>
                                              {t.name}
                                          </span>
                                          {selectedTeamId === t._id && <CheckCircle2 size={14} className="text-primary" />}
                                      </button>
                                  ))}
                              </div>
                          </div>
                      </>
                  )}
               </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:flex-nowrap items-stretch sm:items-center gap-3 w-full md:w-auto">
             
             <div className="relative group w-full sm:w-56">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:opacity-100 transition-opacity" />
                <input 
                  type="text" 
                  placeholder="SEARCH..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl border border-base-200 dark:border-slate-700 h-11 pl-12 pr-8 text-[10px] font-black tracking-[0.2em] outline-none focus:border-primary/50 transition-colors placeholder:opacity-40"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-30 hover:opacity-100"><X size={14} /></button>
                )}
             </div>

             
             <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-base-200 dark:border-slate-700 h-11 px-1 p-1">
                {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
                    <button 
                        key={p}
                        onClick={() => setFilterPriority(p)}
                        className={clsx(
                            "px-2 h-full rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                            filterPriority === p 
                                ? "bg-white dark:bg-slate-700 shadow-sm text-primary" 
                                : "opacity-30 hover:opacity-60"
                        )}
                    >
                        {p}
                    </button>
                ))}
             </div>
             
             {user?.role === 'TEAM_LEADER' && (
                <button 
                    className="btn-premium-glow group/btn overflow-hidden"
                    onClick={() => setIsCreateOpen(true)}
                    disabled={!selectedTeamId}
                >
                    <div className="btn-premium-inner !px-5 !h-11">
                      <div className="flex items-center gap-2">
                          <Plus size={18} className="text-primary group-hover:rotate-90 transition-transform duration-300" /> 
                          <span className="animate-text-glow uppercase tracking-[0.2em] text-[10px] font-black">Initiate Task</span>
                      </div>
                    </div>
                </button>
             )}
          </div>
        </div>
      </div>

      
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 md:p-10 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-[1600px] mx-auto h-full flex gap-8 min-w-[1100px]">
          {columns.map((col) => {
            const currentSortOrder = columnSortOrders[col.id] || 'DESC';
            const colTasks = filteredTasks
              .filter((t: any) => t.status === col.id)
              .sort((a: any, b: any) => {
                const dateA = new Date(a.createdAt).getTime();
                const dateB = new Date(b.createdAt).getTime();
                return currentSortOrder === 'ASC' ? dateA - dateB : dateB - dateA;
              });

            const ColIcon = col.icon;
            const totalInCol = tasks?.filter((t: any) => t.status === col.id).length || 0;

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
                  ) : colTasks.map((task: any) => {
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
                                    {task.assigneeIds?.slice(0, 3).map((id: any, i: number) => {
                                        const memberUser = users?.find((u: any) => u.id === id || u._id === id);
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

                  {!tasksLoading && colTasks.length === 0 && (
                    <div className="h-32 rounded-3xl border-2 border-dashed border-gray-200 flex items-center justify-center dark:opacity-20">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em]">
                        {searchTerm || filterPriority !== 'ALL' ? 'Filtered out' : 'Standby'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      
      {isCreateOpen && selectedTeamId && (
        <CreateTaskModal 
          isOpen={isCreateOpen} 
          onClose={() => setIsCreateOpen(false)} 
          teamId={selectedTeamId} 
        />
      )}

      {activeTaskId && (
        <TaskDetailsModal
          isOpen={!!activeTaskId}
          onClose={() => setActiveTaskId(null)}
          taskId={activeTaskId}
        />
      )}
    </div>
  );
}


