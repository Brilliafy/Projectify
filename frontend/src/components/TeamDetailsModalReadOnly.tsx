import { useQuery } from '@tanstack/react-query';
import { teamApi, userApi } from '../api/axios';
import { X, Calendar, Users } from 'lucide-react';
import clsx from 'clsx';

interface TeamDetailsModalReadOnlyProps {
  teamId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function TeamDetailsModalReadOnly({ teamId, isOpen, onClose }: TeamDetailsModalReadOnlyProps) {
  // Fetch team details
  const { data: team, isLoading } = useQuery({
    queryKey: ['team', teamId],
    queryFn: async () => (await teamApi.get(`/${teamId}`)).data,
    enabled: isOpen,
  });

  // Fetch all users to resolve names
  const { data: allUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await userApi.get('')).data,
    enabled: isOpen,
  });

  const getMemberDetails = (id: number) => allUsers?.find((u: any) => u.id === id);

  if (!isOpen) return null;
  if (isLoading || !team) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl max-w-4xl w-full h-[90vh] flex flex-col overflow-hidden relative animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center shadow-xl shadow-secondary/10">
                 <Users size={28} />
              </div>
              <div>
                 <h2 className="text-3xl font-black font-['Outfit'] tracking-tighter text-slate-900 dark:text-white leading-none mb-2">{team.name}</h2>
                 <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-30 text-slate-500 dark:text-slate-400">Team Details</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                    {team.createdAt && (
                      <div className="flex items-center gap-1.5 opacity-40">
                        <Calendar size={12} />
                        <span className="text-[10px] font-bold uppercase tracking-widest leading-none">
                          Created {new Date(team.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    )}
                 </div>
              </div>
            </div>
            <button
               className="btn btn-ghost btn-circle hover:bg-slate-100 dark:hover:bg-slate-800 transition"
               onClick={onClose}
            >
               <X size={24} />
            </button>
          </div>
        </div>

        
        <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
           
           <div className="flex-1 p-8 space-y-8 overflow-y-auto no-scrollbar">
              <div className="space-y-6">
                 <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Description</h3>
                    <p className="text-sm font-medium leading-relaxed opacity-60 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/50 p-6 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                      {team.description || "No description provided for this team."}
                    </p>
                 </div>
              </div>
           </div>

           
           <div className="w-full md:w-[400px] p-8 bg-slate-50/50 dark:bg-slate-950/20 flex flex-col gap-8 overflow-y-auto no-scrollbar">
              <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between mb-4">
                     <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 leading-none">Team Members</label>
                     <span className="badge badge-sm rounded-lg bg-slate-200 dark:bg-slate-800 border-0 font-black text-[9px] px-2">{team.members.length}</span>
                  </div>
                  
                  <div className="space-y-3 overflow-y-auto pr-2 no-scrollbar">
                    {team.members.map((mId: number) => {
                      const member = getMemberDetails(mId);
                      if (!member) return null;
                      const isMemberLeader = member.id === team.leaderId;
                      
                      return (
                        <div
                          key={mId}
                          className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-3xl transition-all hover:shadow-lg group shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                             <div className={clsx(
                               "w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black uppercase shadow-inner",
                               isMemberLeader ? "bg-violet-500 text-white shadow-amber-500/20" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                             )}>
                                {member.fullName[0]}
                             </div>
                             <div className="flex flex-col">
                                <span className="text-xs font-black tracking-tight">{member.fullName}</span>
                                <div className="flex items-center gap-2">
                                   {isMemberLeader ? (
                                      <span className="text-[8px] font-black text-violet-500 uppercase tracking-widest">Team Leader</span>
                                   ) : (
                                      <span className="text-[8px] font-black opacity-30 uppercase tracking-widest">Member</span>
                                   )}
                                </div>
                             </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
