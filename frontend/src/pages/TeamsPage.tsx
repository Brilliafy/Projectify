import { useQuery } from '@tanstack/react-query';
import { teamApi, userApi } from '../api/axios';
import { Users, Calendar, Crown, LayoutGrid, Plus } from 'lucide-react';
import { useState, useMemo } from 'react';
import CreateTeamModal from '../components/CreateTeamModal';
import TeamDetailsModal from '../components/TeamDetailsModal';
import TeamDetailsModalReadOnly from '../components/TeamDetailsModalReadOnly';
import { useAuth } from '../context/AuthContext';

export default function TeamsPage() {
  const { user } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [activeTeam, setActiveTeam] = useState<string | null>(null);

  const { data: teams, isLoading } = useQuery({
    queryKey: ['teams', user?.role],
    queryFn: async () => {
        if (user?.role === 'ADMIN') {
            return (await teamApi.get('')).data;
        }
        return (await teamApi.get('/mine')).data;
    },
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await userApi.get('')).data,
  });

  const userMap = useMemo(() => {
    const map = new Map<number, any>();
    users?.forEach((u: any) => map.set(u.id, u));
    return map;
  }, [users]);

  if (isLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
            <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-10 font-['Inter']">
      <div className="max-w-7xl mx-auto space-y-10">
        
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-base-200 dark:border-slate-800">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-[0.2em] text-[10px] opacity-60">
              <Users size={12} /> Resource Management
            </div>
            <div className="space-y-1">
                <h1 className="text-5xl font-black font-['Outfit'] tracking-tighter leading-none">
                  Teams<span className="text-primary">.</span>
                </h1>
                <p className="text-sm opacity-40 font-medium">
                    {user?.role === 'ADMIN' ? `Managing All System Entities (${teams?.length})` : `Collaborating across ${teams?.length} Teams`}
                </p>
            </div>
          </div>

          {user?.role === 'TEAM_LEADER' && (
            <button
              className="btn btn-primary rounded-2xl px-6 font-bold shadow-lg shadow-primary/20 gap-2 font-['Outfit'] uppercase tracking-widest text-xs"
              onClick={() => setCreateOpen(true)}
            >
              <Plus size={16} /> Create Team
            </button>
          )}
        </div>

        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {teams?.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-base-200 dark:border-slate-800 shadow-sm">
                <LayoutGrid size={48} className="mx-auto opacity-10 mb-4" />
                <p className="text-lg font-['Outfit'] font-bold opacity-40 uppercase tracking-widest">No Teams Found</p>
                <p className="text-sm opacity-30 mt-1">Start by creating a new collaboration space.</p>
            </div>
          ) : (
            teams?.map((team: any) => {
              const isOwner = team.leaderId === user?.id;
              const leader = userMap.get(team.leaderId);

              return (
                <div
                  key={team._id}
                  onClick={() => setActiveTeam(team._id)}
                  className="group relative bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-base-200 dark:border-slate-800 hover:border-primary transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 cursor-pointer flex flex-col h-full overflow-hidden"
                >
                  
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -mr-10 -mt-10 group-hover:bg-primary/10 transition-colors" />
                  
                  <div className="relative flex-1">
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <Users size={24} />
                      </div>
                      {isOwner && (
                        <div className="pl-2 pr-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center gap-1.5 transform translate-y-1">
                          <Crown size={12} />
                          <span className="text-[10px] font-black uppercase tracking-widest leading-none">Your team</span>
                        </div>
                      )}
                    </div>

                    <h2 className="text-2xl font-black font-['Outfit'] tracking-tight mb-3 group-hover:text-primary transition-colors truncate">
                      {team.name}
                    </h2>

                    <p className="text-sm opacity-50 font-medium leading-relaxed line-clamp-3 mb-8">
                      {team.description || 'No description provided for this team room.'}
                    </p>
                  </div>

                  
                  <div className="relative pt-6 border-t border-base-100 dark:border-slate-800 flex items-center justify-between gap-4 overflow-hidden">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                        {leader?.fullName?.[0] ?? 'U'}
                      </div>
                      <span className="text-[11px] font-bold opacity-70 truncate" title={`Lead by ${leader?.fullName}`}>
                        {leader?.fullName ?? 'Unknown'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest opacity-30">
                        <Users size={12} className="shrink-0" />
                        {team.members.length}
                      </div>

                      <span className="w-1 h-1 rounded-full bg-base-300 shrink-0" />

                      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest opacity-30" title={`Created: ${new Date(team.createdAt).toLocaleDateString()}`}>
                        <Calendar size={12} className="shrink-0" />
                        {new Date(team.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {user?.role === 'TEAM_LEADER' && (
        <CreateTeamModal
            isOpen={createOpen}
            onClose={() => setCreateOpen(false)}
        />
      )}

      {activeTeam && (
        user?.role === 'ADMIN' ? (
            <TeamDetailsModalReadOnly
                teamId={activeTeam}
                isOpen={!!activeTeam}
                onClose={() => setActiveTeam(null)}
            />
        ) : (
            <TeamDetailsModal
                teamId={activeTeam}
                isOpen={!!activeTeam}
                onClose={() => setActiveTeam(null)}
            />
        )
      )}
    </div>
  );
}

