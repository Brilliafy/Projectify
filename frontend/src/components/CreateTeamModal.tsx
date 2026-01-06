import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { teamApi } from '../api/axios';
import { X, Loader2, Users, Target, Layout, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateTeamModal({ isOpen, onClose }: CreateTeamModalProps) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const isAllowed = user?.role === 'TEAM_LEADER' || user?.role === 'ADMIN';

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const createMutation = useMutation({
    mutationFn: async (data: any) => teamApi.post('', data),
    onSuccess: () => {
      toast.success('Team created successfully');
      qc.invalidateQueries({ queryKey: ['teams'] });
      reset();
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to create team');
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div
        className="
          w-full max-w-xl bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300
        "
        onClick={(e) => e.stopPropagation()}
      >
        
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />

        
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center relative z-10">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                <Users size={24} />
             </div>
             <div>
                <h2 className="text-2xl font-black font-['Outfit'] tracking-tighter text-slate-900 dark:text-white">Create Team</h2>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-30 text-slate-500 dark:text-slate-400">Team Management</span>
             </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-circle hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-8 relative z-10">
          {!isAllowed ? (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                    <ShieldAlert size={20} />
                </div>
                <p className="text-xs font-bold text-amber-600/80 leading-relaxed uppercase tracking-tight">
                    Access Denied: Only Team Leaders or Administrators can create new teams.
                </p>
            </div>
          ) : (
            <p className="text-sm font-medium opacity-50 font-['Inter'] leading-relaxed text-slate-600 dark:text-slate-400">
              Create a new team to organize members and manage shared tasks efficiently.
            </p>
          )}

          <form
            onSubmit={handleSubmit((data) => createMutation.mutate(data))}
            className="space-y-6"
          >
            <div className="form-control">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-2 flex items-center gap-2">
                <Target size={12} /> Team Name
              </label>
              <input
                {...register('name', { required: 'Team name is required' })}
                className={clsx(
                  "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/30 transition-all text-slate-900 dark:text-white",
                  errors.name && "border-rose-500/50 ring-4 ring-rose-500/5 bg-rose-500/5"
                )}
                placeholder="e.g. Design Team"
                disabled={!isAllowed || createMutation.isPending}
              />
              {errors.name && <span className="text-[10px] font-black text-rose-500 mt-2 ml-1 uppercase">{errors.name.message as string}</span>}
            </div>

            <div className="form-control">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-2 flex items-center gap-2">
                <Layout size={12} /> Description
              </label>
              <textarea
                {...register('description')}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/30 transition-all text-slate-900 dark:text-white min-h-[120px]"
                placeholder="Briefly describe the team's purpose..."
                disabled={!isAllowed || createMutation.isPending}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-ghost rounded-2xl font-black uppercase tracking-widest text-[10px] px-8"
                disabled={createMutation.isPending}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!isAllowed || createMutation.isPending}
                className="btn-premium-glow group overflow-hidden"
              >
                <div className="btn-premium-inner px-8 py-3 flex items-center gap-3">
                    {createMutation.isPending ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Users size={16} className="group-hover:scale-110 transition-transform" />
                    )}
                    <span className="text-[11px] font-black uppercase tracking-widest">
                       {createMutation.isPending ? 'Creating...' : 'Create Team'}
                    </span>
                </div>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
