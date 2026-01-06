import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamApi, userApi } from '../api/axios';
import { X, Trash2, UserPlus, Calendar, Shield, Search, Users, Target, Layout, Trash } from 'lucide-react';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';

interface TeamDetailsModalProps {
  teamId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function TeamDetailsModal({ teamId, isOpen, onClose }: TeamDetailsModalProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch team details
  const { data: team, isLoading } = useQuery({
    queryKey: ['team', teamId],
    queryFn: async () => (await teamApi.get(`/${teamId}`)).data,
    enabled: isOpen,
  });

  // Fetch all users
  const { data: allUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await userApi.get('')).data,
    enabled: isOpen,
  });

  const isLeader = team?.leaderId === user?.id;

  // Mutations
  const addMemberMutation = useMutation({
    mutationFn: async (userId: number) =>
      teamApi.post(`/${teamId}/members`, { userIdToAdd: userId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] });
      qc.invalidateQueries({ queryKey: ['team', teamId] });
      toast.success('Member added successfully');
      setSearchTerm('');
    },
    onError: () => toast.error('Failed to add member'),
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (userId: number) =>
      teamApi.delete(`/${teamId}/members/${userId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] });
      qc.invalidateQueries({ queryKey: ['team', teamId] });
      toast.success('Member removed from team');
    },
    onError: () => toast.error('Failed to remove member'),
  });

  const updateTeamMutation = useMutation({
    mutationFn: async (data: any) => teamApi.patch(`/${teamId}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] });
      qc.invalidateQueries({ queryKey: ['team', teamId] });
      toast.success('Team updated successfully');
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async () => teamApi.delete(`/${teamId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Team deleted');
      onClose();
    },
    onError: () => toast.error('Failed to delete team'),
  });

  const { register, handleSubmit, setValue } = useForm({
    defaultValues: { name: '', description: '' },
  });

  useEffect(() => {
    if (team) {
      setValue('name', team.name);
      setValue('description', team.description);
    }
  }, [team, setValue]);

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
              <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/20">
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
            <div className="flex items-center gap-2">
               {isLeader && (
                  <button 
                    onClick={() => window.confirm('Delete this team?') && deleteTeamMutation.mutate()}
                    className="btn btn-ghost btn-circle text-rose-500 hover:bg-rose-500/10 "
                    title="Delete Team"
                  >
                    <Trash2 size={20} />
                  </button>
               )}
               <button
                 className="btn btn-ghost btn-circle hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                 onClick={onClose}
               >
                 <X size={24} />
               </button>
            </div>
          </div>
        </div>

        
        <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
           
           <div className="flex-1 p-8 space-y-8 overflow-y-auto no-scrollbar">
              {isLeader && (
                <form
                  onSubmit={handleSubmit((d) => updateTeamMutation.mutate(d))}
                  className="space-y-6"
                >
                  <div className="form-control">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-2 flex items-center gap-2">
                       <Target size={12} /> Team Name
                    </label>
                    <input
                      {...register('name', { required: true })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/30 transition-all text-slate-900 dark:text-white"
                      placeholder="Enter team name..."
                    />
                  </div>
                  <div className="form-control">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-2 flex items-center gap-2">
                       <Layout size={12} /> Description
                    </label>
                    <textarea
                      {...register('description')}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/30 transition-all text-slate-900 dark:text-white min-h-[140px]"
                      rows={4}
                      placeholder="Describe the team..."
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="btn-premium-glow group overflow-hidden"
                      disabled={updateTeamMutation.isPending}
                    >
                      <div className="btn-premium-inner px-6 py-2.5 flex items-center gap-2">
                          {updateTeamMutation.isPending ? (
                            <span className="loading loading-spinner loading-xs"></span>
                          ) : (
                            <Shield size={14} className="group-hover:rotate-12 transition-transform" />
                          )}
                          <span className="text-[10px] font-black uppercase tracking-widest">
                             Update Team
                          </span>
                      </div>
                    </button>
                  </div>
                </form>
              )}

              {!isLeader && (
                <div className="space-y-6">
                   <div className="space-y-4">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Description</h3>
                      <p className="text-sm font-medium leading-relaxed opacity-60 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/50 p-6 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                        {team.description || "No description provided for this team."}
                      </p>
                   </div>
                </div>
              )}
           </div>

           
           <div className="w-full md:w-[400px] p-8 bg-slate-50/50 dark:bg-slate-950/20 flex flex-col gap-8 overflow-y-auto no-scrollbar">
              
              {isLeader && allUsers && (
                <div className="space-y-4 shrink-0">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 flex items-center gap-2 leading-none">
                     <UserPlus size={12} /> Add Members
                  </label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20" size={16} />
                    <input
                      type="text"
                      placeholder="Search users..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/30 transition-all text-slate-900 dark:text-white shadow-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  {searchTerm && (
                    <div className="max-h-48 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-xl animate-in fade-in slide-in-from-top-2">
                      {allUsers
                        .filter(
                          (u: any) =>
                            !team.members.includes(u.id) &&
                            (u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             u.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
                            u.role !== 'ADMIN'
                        )
                        .map((u: any) => (
                          <div
                            key={u.id}
                            className="flex justify-between items-center p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer group"
                            onClick={() => addMemberMutation.mutate(u.id)}
                          >
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-primary flex items-center justify-center text-[10px] font-black uppercase">
                                  {u.fullName[0]}
                               </div>
                               <div className="flex flex-col">
                                  <span className="text-xs font-bold">{u.fullName}</span>
                                  <span className="text-[9px] opacity-40 uppercase font-black tracking-tighter">{u.email}</span>
                               </div>
                            </div>
                            <UserPlus size={14} className="opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
                          </div>
                        ))}
                      {allUsers?.filter((u: any) => !team.members.includes(u.id) && u.fullName.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                        <div className="p-4 text-center text-[10px] font-black uppercase opacity-30">No matching users</div>
                      )}
                    </div>
                  )}
                </div>
              )}

              
              <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between mb-4">
                     <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 leading-none">Team Members</label>
                     <span className="badge badge-sm rounded-lg bg-slate-200 dark:bg-slate-800 border-0 font-black text-[9px] px-2">{team.members.length}</span>
                  </div>
                  <div className="space-y-3 overflow-y-auto pr-2 no-scrollbar">
                    {team.members.map((mId: number) => {
                      const member = allUsers?.find((u: any) => u.id === mId);
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
                          
                          {isLeader && member.id !== team.leaderId && (
                            <button
                              className="w-8 h-8 rounded-xl flex items-center justify-center bg-rose-500/10 text-rose-500 opacity-0 group-hover:opacity-100 hover:bg-rose-500 hover:text-white transition-all duration-300 !p-0"
                              onClick={() => removeMemberMutation.mutate(member.id)}
                            >
                              <Trash size={14} />
                            </button>
                          )}
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
