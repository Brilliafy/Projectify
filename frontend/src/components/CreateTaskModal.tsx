import { X, Loader2, Users, Search, Target, Plus, FileText, Image as ImageIcon, FileCode, Trash2 } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { taskApi, teamApi, userApi } from '../api/axios';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import axios from 'axios';
import RichTextEditor from './RichTextEditor';
import type { Team, User, TaskPriority } from '../types';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
}

interface CreateTaskFormValues {
  title: string;
  description: string;
  priority: TaskPriority;
  deadline?: string;
  assignees: string[] | string;
}

export default function CreateTaskModal({ isOpen, onClose, teamId }: CreateTaskModalProps) {
  const qc = useQueryClient();
  const { register, handleSubmit, reset, setValue, control, formState: { errors } } = useForm<CreateTaskFormValues>();
  const priority = useWatch({ control, name: 'priority', defaultValue: 'MEDIUM' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>(teamId === 'ALL' ? '' : teamId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Fetch Teams for Dropdown (Teams I OWN)
  const { data: myTeams } = useQuery<Team[]>({
    queryKey: ['teams', 'owned'],
    queryFn: async () => (await teamApi.get('/owned')).data,
    enabled: isOpen
  });

  // Validate that the initially selected team is actually owned. If not, reset it.
  useEffect(() => {
    if (myTeams && selectedTeamId && selectedTeamId !== 'ALL') {
      const isOwned = myTeams.some((t: Team) => t._id === selectedTeamId);
      if (!isOwned) {
        queueMicrotask(() => {
          setSelectedTeamId('');
          setValue('assignees', []);
        });
      }
    }
  }, [myTeams, selectedTeamId, setValue]);
  
  // Fetch Team Members for SELECTED Team
  const { data: teamDetails } = useQuery<Team>({
    queryKey: ['team', selectedTeamId],
    queryFn: async () => (await teamApi.get(`/${selectedTeamId}`)).data,
    enabled: !!selectedTeamId && selectedTeamId !== 'ALL',
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => (await userApi.get('')).data,
    enabled: isOpen,
  });

  // Filter users to only team members
  const teamMembers = users?.filter((u: User) => teamDetails?.members?.includes(u.id)) || [];
  
  // Filter by search
  const filteredMembers = teamMembers.filter((m: User) => 
    m.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = (e: React.MouseEvent) => {
    e.preventDefault();
    const ids = filteredMembers.map((m: User) => m.id.toString());
    setValue('assignees', ids);
  };

  const handleDeselectAll = (e: React.MouseEvent) => {
    e.preventDefault();
    setValue('assignees', []);
  };

  const createMutation = useMutation({
    mutationFn: async (data: CreateTaskFormValues) => {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description || '');
      formData.append('priority', data.priority);
      formData.append('teamId', selectedTeamId);
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
    onError: (err: unknown) => {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        toast.error(err.response.data.error);
      } else {
        toast.error('Failed to create task');
      }
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
                  setValue('assignees', []);
               }}
               required
             >
               <option value="" disabled>Select a team...</option>
               {myTeams?.map((t: Team) => (
                 <option key={t._id} value={t._id}>{t.name}</option>
               ))}
             </select>
          </div>

          <div className="form-control group">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-2 block animate-in slide-in-from-left-2">Task Title</label>
            <input 
              {...register('title', { required: 'Title is required' })} 
              className={clsx(
                "w-full bg-slate-50 dark:bg-slate-950 border rounded-2xl p-4 font-bold text-sm outline-none focus:border-primary transition-all",
                errors.title ? "border-error" : "border-base-200 dark:border-slate-800"
              )}
              placeholder="e.g. Implement OAuth Flow"
            />
            {errors.title && <span className="text-error text-xs mt-1 ml-1">{errors.title.message}</span>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="form-control">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-2 block">Priority Level</label>
                <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-base-200 dark:border-slate-800">
                   {(['LOW', 'MEDIUM', 'HIGH'] as const).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setValue('priority', p)}
                        className={clsx(
                           "py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                           priority === p ? "bg-white dark:bg-slate-800 text-primary shadow-md shadow-black/5" : "opacity-40 hover:opacity-100"
                        )}
                      >
                         {p}
                      </button>
                   ))}
                </div>
             </div>

             <div className="form-control">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-2 block">Deadline Date</label>
                <div className="relative">
                   <input 
                      type="date" 
                      {...register('deadline')}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-base-200 dark:border-slate-800 rounded-2xl p-3.5 font-bold text-xs outline-none focus:border-primary transition-all text-base-content"
                   />
                </div>
             </div>
          </div>

          <div className="form-control">
             <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-2 block">Detailed Description</label>
             <RichTextEditor 
                content="" 
                onChange={(html) => setValue('description', html)}
                minHeight="120px"
             />
          </div>

          <div className="form-control">
            <div className="flex items-center justify-between mb-2">
               <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Files & Attachments</label>
               <span className="text-[10px] font-bold opacity-30">Max 5 files (2MB each)</span>
            </div>
            
            <input 
              type="file" 
              multiple 
              ref={fileInputRef} 
              className="hidden" 
              onChange={(e) => {
                if (e.target.files) {
                  const newFiles = Array.from(e.target.files);
                  if (selectedFiles.length + newFiles.length > 5) {
                    toast.error('Maximum 5 files allowed');
                    return;
                  }
                  const invalidSize = newFiles.some(f => f.size > 2 * 1024 * 1024);
                  if (invalidSize) {
                    toast.error('File size exceeds 2MB limit');
                    return;
                  }
                  setSelectedFiles(prev => [...prev, ...newFiles]);
                }
              }} 
            />

            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-base-200 dark:border-slate-800 hover:border-primary/50 rounded-2xl p-6 text-center cursor-pointer transition-all hover:bg-slate-50/50 dark:hover:bg-slate-950/50 group"
            >
               <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Plus size={20} className="opacity-40 group-hover:opacity-100 transition-opacity" />
               </div>
               <span className="text-xs font-bold block mb-1">Click to browse or drag and drop</span>
               <span className="text-[10px] opacity-40">Supports .webp, .jpg, .zip, .pdf, .txt</span>
            </div>

            {selectedFiles.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                 {selectedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-base-200 dark:border-slate-800">
                       <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                             {file.type.includes('image') ? <ImageIcon size={16} /> : file.type.includes('pdf') ? <FileText size={16} /> : <FileCode size={16} />}
                          </div>
                          <div className="truncate">
                             <div className="text-xs font-bold truncate">{file.name}</div>
                             <div className="text-[9px] opacity-40 font-mono">{(file.size / 1024).toFixed(1)} KB</div>
                          </div>
                       </div>
                       <button 
                         type="button" 
                         onClick={() => removeFile(idx)}
                         className="btn btn-ghost btn-circle btn-xs text-error opacity-40 hover:opacity-100"
                       >
                          <Trash2 size={14} />
                       </button>
                    </div>
                 ))}
              </div>
            )}
          </div>

          <div className="form-control">
             <div className="flex items-center justify-between mb-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Assignees</label>
                <div className="flex gap-2">
                   <button type="button" onClick={handleSelectAll} className="text-[10px] font-black uppercase tracking-wider text-primary hover:underline">Select All</button>
                   <span className="text-[10px] opacity-30">•</span>
                   <button type="button" onClick={handleDeselectAll} className="text-[10px] font-black uppercase tracking-wider opacity-40 hover:opacity-100">Clear</button>
                </div>
             </div>

             <div className="relative mb-3">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" />
                <input 
                  type="text" 
                  placeholder="Search assignees..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-base-200 dark:border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs font-bold outline-none focus:border-primary transition-all"
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
                filteredMembers.map((m: User) => (
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
                      value={m.id.toString()}
                      {...register('assignees')}
                      className="checkbox checkbox-primary checkbox-sm rounded-lg"
                    />
                  </label>
                ))
              )}
             </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-base-200 dark:border-slate-800">
             <button type="button" onClick={onClose} className="btn btn-ghost rounded-2xl px-6 font-bold text-xs uppercase tracking-widest opacity-60">Cancel</button>
             <button 
               type="submit" 
               disabled={createMutation.isPending || !selectedTeamId}
               className="btn btn-primary rounded-2xl px-8 font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 gap-2 min-w-[140px]"
             >
                {createMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Create Task'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}