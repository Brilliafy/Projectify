import { X, Loader2, Users, Search, Calendar, Target, Flag, Layers, Plus, FileText, Image as ImageIcon, FileCode, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { taskApi, teamApi, userApi } from '../api/axios';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import RichTextEditor from './RichTextEditor';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
}

export default function CreateTaskModal({ isOpen, onClose, teamId }: CreateTaskModalProps) {
  const qc = useQueryClient();
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();
  const priority = watch('priority', 'MEDIUM');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>(teamId === 'ALL' ? '' : teamId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };
  // Fetch Teams for Dropdown (Teams I OWN)
  const { data: myTeams } = useQuery({
    queryKey: ['teams', 'owned'],
    queryFn: async () => (await teamApi.get('/owned')).data,
    enabled: isOpen
  });

  // Validate that the initially selected team is actually owned. If not, reset it.
  useEffect(() => {
    if (myTeams && selectedTeamId && selectedTeamId !== 'ALL') {
       const isOwned = myTeams.some((t: any) => t._id === selectedTeamId);
       if (!isOwned) {
          setSelectedTeamId('');
          setValue('assignees', []);
       }
    }
  }, [myTeams, selectedTeamId, setValue]);
  
  // Fetch Team Members for SELECTED Team
  const { data: teamDetails } = useQuery({
    queryKey: ['team', selectedTeamId],
    queryFn: async () => (await teamApi.get(`/${selectedTeamId}`)).data,
    enabled: !!selectedTeamId && selectedTeamId !== 'ALL',
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await userApi.get('')).data,
    enabled: isOpen,
  });

  // Filter users to only team members
  const teamMembers = users?.filter((u: any) => teamDetails?.members?.includes(u.id)) || [];
  
  // Filter by search
  const filteredMembers = teamMembers.filter((m: any) => 
    m.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = (e: any) => {
    e.preventDefault();
    const ids = filteredMembers.map((m: any) => m.id.toString());
    setValue('assignees', ids);
  };

  const handleDeselectAll = (e: any) => {
    e.preventDefault();
    setValue('assignees', []);
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description || '');
      formData.append('priority', data.priority);
      formData.append('teamId', selectedTeamId); // Use selected state
      if (data.deadline) formData.append('deadline', data.deadline);
      
      const assignedIds = data.assignees 
        ? (Array.isArray(data.assignees) ? data.assignees : [data.assignees])
        : [];
      const validAssignees = assignedIds.map((id: string) => Number(id)).filter((n: number) => !isNaN(n));
      formData.append('assigneeIds', JSON.stringify(validAssignees));

      if (selectedFiles.length > 0) {
        selectedFiles.forEach(file => {
          formData.append('files', file);
        });
      }

      return taskApi.post('', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task created successfully');
      reset();
      setSearchTerm('');
      setSelectedFiles([]);
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to create task');
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden relative flex flex-col border border-white/20 dark:border-slate-800"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-8 border-b border-base-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 shrink-0">
          <div>
            <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-[0.2em] text-[10px] mb-2 opacity-60">
               <Target size={12} /> Specify Description...
            </div>
            <h2 className="text-3xl font-black font-['Outfit'] tracking-tighter">New Task<span className="text-primary">.</span></h2>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-circle hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="p-8 space-y-8 overflow-y-auto no-scrollbar">
          
          
          <div className="form-control">
             <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-2 block">Assigned Team</label>
             <select 
               className="w-full bg-slate-50 dark:bg-slate-950 border border-base-200 dark:border-slate-800 rounded-2xl p-4 font-bold text-sm outline-none focus:border-primary transition-all appearance-none"
               value={selectedTeamId}
               onChange={(e) => {
                  setSelectedTeamId(e.target.value);
                  setValue('assignees', []); // Reset assignees on team change
               }}
               required
             >
               <option value="" disabled>Select a team...</option>
               {myTeams?.map((t: any) => (
                 <option key={t._id} value={t._id}>{t.name}</option>
               ))}
             </select>
          </div>

          
          <div className="form-control group">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-2 block animate-in slide-in-from-left-2">Task Title</label>
            <input 
              {...register('title', { required: 'Title is required' })} 
              className={clsx(
                "w-full bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-primary/30 rounded-2xl p-4 font-black font-['Outfit'] text-xl tracking-tight transition-all outline-none",
                errors.title ? "border-rose-500/50" : "hover:bg-slate-100 dark:hover:bg-slate-900"
              )}
              placeholder="E.G. CORE PROTOCOL OPTIMIZATION..."
            />
            {errors.title && <span className="text-rose-500 text-[10px] font-black uppercase tracking-widest mt-2 block">{errors.title.message as string}</span>}
          </div>

          
          <div className="form-control">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-2 block">Task Documentation</label>
            <RichTextEditor 
              content="" 
              onChange={(html) => setValue('description', html)} 
              minHeight="150px"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="form-control">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-2 flex items-center gap-2"><Flag size={12} /> Strategic Priority</label>
              <div className="flex gap-2 bg-slate-50 dark:bg-slate-950 p-2 rounded-2xl border border-base-200 dark:border-slate-800">
                {['LOW', 'MEDIUM', 'HIGH'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setValue('priority', p)}
                    className={clsx(
                      "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      priority === p
                        ? "bg-white dark:bg-slate-800 shadow-xl text-primary scale-[1.02]"
                        : "opacity-40 hover:opacity-100"
                    )}
                  >
                    {p}
                  </button>
                ))}
                <input type="hidden" {...register('priority')} defaultValue="MEDIUM" />
              </div>
            </div>

            
            <div className="form-control">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-2 flex items-center gap-2"><Calendar size={12} /> Execution Deadline</label>
              <input 
                type="date" 
                {...register('deadline', { 
                  required: 'Deadline is required',
                  validate: (value) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const selectedDate = new Date(value);
                    return selectedDate >= today || 'Deadline cannot be in the past';
                  }
                })} 
                className={clsx(
                    "w-full bg-slate-50 dark:bg-slate-950 border border-base-200 dark:border-slate-800 rounded-2xl p-4 font-bold text-sm outline-none transition-all hover:border-primary/30 focus:border-primary",
                    errors.deadline && "border-rose-500/50"
                )}
              />
              {errors.deadline && <span className="text-rose-500 text-[10px] font-black uppercase tracking-widest mt-2 block">{errors.deadline.message as string}</span>}
            </div>
          </div>

          
          <div className="form-control">
            <div className="flex items-center justify-between mb-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 flex items-center gap-2"><Users size={12} /> Team Members</label>
                <div className="flex gap-2">
                    <button onClick={handleSelectAll} className="px-3 py-1 bg-slate-50 dark:bg-slate-950 border border-base-200 dark:border-slate-800 rounded-lg text-[8px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-all">Select All</button>
                    <button onClick={handleDeselectAll} className="px-3 py-1 bg-slate-50 dark:bg-slate-950 border border-base-200 dark:border-slate-800 rounded-lg text-[8px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-all">Deselect</button>
                </div>
            </div>
            

            <div className={clsx(
                "bg-slate-50 dark:bg-slate-950 border border-base-200 dark:border-slate-800 rounded-[2rem] p-4 transition-all",
                !selectedTeamId && "opacity-50 pointer-events-none grayscale"
            )}>
               
               <div className="relative mb-4">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20 w-4 h-4" />
                 <input 
                   type="text" 
                   className="w-full bg-white dark:bg-slate-900 border border-base-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm font-medium outline-none focus:border-primary transition-all" 
                   placeholder="SEARCH TEAM MEMBERS..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   disabled={!selectedTeamId}
                 />
               </div>

               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto no-scrollbar pr-1">
                {!selectedTeamId ? (
                   <div className="col-span-full py-10 flex flex-col items-center justify-center opacity-40 bg-white/50 dark:bg-slate-900/50 rounded-2xl">
                     <Target size={32} />
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] mt-2">Select a Team First</span>
                   </div>
                ) : filteredMembers.length === 0 ? (
                  <div className="col-span-full py-10 flex flex-col items-center justify-center opacity-20 bg-white/50 dark:bg-slate-900/50 rounded-2xl">
                    <Users size={32} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] mt-2">No Team Members Available</span>
                  </div>
                ) : (
                  filteredMembers.map((m: any) => (
                    <label 
                        key={m.id} 
                        className={clsx(
                            "cursor-pointer flex items-center justify-between p-3 rounded-2xl transition-all border",
                            searchTerm && m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ? "opacity-100" : "opacity-100",
                            "bg-white dark:bg-slate-900 border-base-200 dark:border-slate-800 hover:border-primary/50 group/item"
                        )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="avatar placeholder">
                          <div className="bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full w-8 h-8 flex items-center justify-center text-center font-black text-[10px]">
                             {m.fullName[0].toUpperCase()}
                          </div>
                        </div>
                        <div className="min-w-0">
                           <div className="font-bold text-xs truncate">{m.fullName}</div>
                           <div className="text-[8px] opacity-40 uppercase font-black tracking-widest">{m.role}</div>
                        </div>
                      </div>
                      <input 
                        type="checkbox" 
                        value={m.id} 
                        {...register('assignees')} 
                        className="checkbox checkbox-sm checkbox-primary rounded-lg border-2" 
                      />
                    </label>
                  ))
                )}
               </div>
            </div>
          </div>

          
          <div className="form-control">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-2 flex items-center gap-2"><Layers size={12} /> Data Attachments</label>
            
            <div className="space-y-4">
              <div 
                className="bg-slate-50 dark:bg-slate-950 border border-dashed border-base-200 dark:border-slate-800 rounded-3xl p-8 transition-all hover:bg-slate-100 dark:hover:bg-slate-900 group/upload cursor-pointer relative"
                onClick={() => fileInputRef.current?.click()}
              >
                  <input 
                    type="file" 
                    multiple 
                    ref={fileInputRef}
                    onChange={(e) => {
                      if (e.target.files) {
                        const newFiles = Array.from(e.target.files);
                        const ALLOWED_EXTENSIONS = ['webp', 'jpg', 'jpeg', 'zip', 'rar', '7z', 'pdf', 'txt'];
                        const MAX_SIZE = 2 * 1024 * 1024; // 2MB

                        if (selectedFiles.length + newFiles.length > 5) {
                           toast.error('Max 5 files allowed in total');
                           return;
                        }

                        const validFiles = newFiles.filter(file => {
                            const ext = file.name.split('.').pop()?.toLowerCase() || '';
                            if (!ALLOWED_EXTENSIONS.includes(ext)) {
                                toast.error(`Invalid file type: ${file.name}`);
                                return false;
                            }
                            if (file.size > MAX_SIZE) {
                                toast.error(`File too large (>2MB): ${file.name}`);
                                return false;
                            }
                            return true;
                        });

                        setSelectedFiles(prev => [...prev, ...validFiles]);
                      }
                    }}
                    className="hidden" 
                    accept=".webp,.jpg,.jpeg,.zip,.rar,.7z,.pdf,.txt"
                  />
                  <div className="flex flex-col items-center justify-center text-center gap-2">
                      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center group-hover/upload:scale-110 transition-transform">
                          <Layers className="opacity-40" size={24} />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Drop fragments or click to upload</p>
                      <p className="text-[8px] font-bold opacity-20 uppercase tracking-[0.2em]">MAX 5 FILES • 2MB LIMIT • IMG/ZIP/PDF/TXT</p>
                  </div>
              </div>

              {selectedFiles.length > 0 && (
                <div className="grid grid-cols-1 gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
                  {selectedFiles.map((file, i) => {
                    const isImage = file.type.startsWith('image/');
                    const isPdf = file.type === 'application/pdf';
                    
                    return (
                      <div key={i} className="group/card flex items-center gap-4 bg-white dark:bg-slate-900 border border-base-200 dark:border-slate-800 p-4 rounded-2xl hover:shadow-xl hover:border-primary/30 transition-all duration-300">
                        <div className={clsx(
                          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner",
                          isImage ? "bg-emerald-500/10 text-emerald-500" : 
                          isPdf ? "bg-rose-500/10 text-rose-500" : 
                          "bg-blue-500/10 text-blue-500"
                        )}>
                          {isImage ? <ImageIcon size={20} /> : 
                           isPdf ? <FileText size={20} /> : 
                           <FileCode size={20} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black truncate uppercase tracking-tight">{file.name}</p>
                          <p className="text-[10px] font-bold opacity-30 mt-0.5">{(file.size / 1024).toFixed(1)} KB • {file.type.split('/')[1]?.toUpperCase() || 'BINARY'}</p>
                        </div>
                        <button 
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                          className="w-8 h-8 !p-0 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 opacity-0 group-hover/card:opacity-100 hover:bg-rose-500/10 hover:text-rose-500 transition-all duration-200"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="pt-8 flex justify-end gap-5 border-t border-base-200 dark:border-slate-800 shrink-0">
            <button type="button" onClick={onClose} className="px-6 py-3 rounded-2xl text-red-400 hover:text-red-500 uppercase tracking-widest text-[10px] opacity-80 hover:opacity-100 transition-all hover:bg-slate-100 dark:hover:bg-slate-800">Abort</button>
            
            <button 
              type="submit" 
              className="btn-premium-glow group/btn"
              disabled={createMutation.isPending}
            >
              <div className="btn-premium-inner">
                <div className="flex items-center gap-3">
                  {createMutation.isPending ? (
                    <Loader2 className="animate-spin w-4 h-4 text-primary" />
                  ) : (
                    <Plus size={18} className="text-primary group-hover/btn:animate-pulse" />
                  )}
                  <span className="animate-text-glow uppercase tracking-[0.2em] text-[10px] font-black">
                    Finalize Implementation
                  </span>
                </div>
              </div>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}