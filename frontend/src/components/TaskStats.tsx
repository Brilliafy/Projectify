import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { LayoutDashboard, CheckCircle2, CircleDot, Clock } from 'lucide-react';
import clsx from 'clsx';

export default function TaskStats({ tasks }: { tasks: any[] }) {
  if (!tasks || tasks.length === 0) return null;

  const stats = [
    { 
      name: 'To Do', 
      value: tasks.filter(t => t.status === 'TODO').length, 
      color: '#64748b', 
      icon: CircleDot,
      bg: 'bg-slate-500/10',
      text: 'text-slate-600 dark:text-slate-400'
    },
    { 
      name: 'In Progress', 
      value: tasks.filter(t => t.status === 'IN_PROGRESS').length, 
      color: '#f59e0b', 
      icon: Clock,
      bg: 'bg-amber-500/10',
      text: 'text-amber-600 dark:text-amber-400'
    },
    { 
      name: 'Done', 
      value: tasks.filter(t => t.status === 'DONE').length, 
      color: '#10b981', 
      icon: CheckCircle2,
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-600 dark:text-emerald-400'
    },
  ];

  const chartData = stats.filter(item => item.value > 0);

  return (
    <div className="space-y-4">
      <div className="card bg-white/50 dark:bg-slate-900/50 backdrop-blur-md shadow-xl border border-white/20 dark:border-slate-800/50 overflow-hidden">
        <div className="card-body p-6">
          <div className="flex items-center gap-2 mb-6">
             <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <LayoutDashboard size={20} />
             </div>
             <h3 className="font-bold text-lg tracking-tight font-['Outfit']">Overview</h3>
          </div>

          <div className="h-48 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color} 
                        className="hover:opacity-80 transition-opacity cursor-pointer focus:outline-none"
                    />
                  ))}
                </Pie>
                <Tooltip 
                    contentStyle={{ 
                        borderRadius: '12px', 
                        border: 'none', 
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        padding: '8px 12px'
                    }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black font-['Outfit']">{tasks.length}</span>
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-40 font-['Inter']">Tasks</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 mt-4">
            {stats.map((s) => (
               <div key={s.name} className={clsx("flex items-center justify-between p-3 rounded-xl border border-transparent transition-all hover:border-base-300 bg-slate-100 dark:bg-slate-800/50")}>
                  <div className="flex items-center gap-3">
                     <div className={clsx("p-2 rounded-lg", s.bg, s.text)}>
                        <s.icon size={16} />
                     </div>
                     <span className="text-sm font-semibold opacity-70">{s.name}</span>
                  </div>
                  <span className="text-lg font-bold font-['Outfit']">{s.value}</span>
               </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}