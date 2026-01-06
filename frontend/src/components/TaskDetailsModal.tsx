import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi, userApi, teamApi } from '../api/axios';
import { X, Trash2, Calendar, Paperclip, Download, Send, FileText, Eye, CheckCircle2, Clock, CircleDot, Edit2, Save, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';
import RichTextEditor from './RichTextEditor';

interface TaskDetailsModalProps {
  taskId: string;
  isOpen: boolean;
  onClose: () => void;
}


//  Attachments Components 
const PdfAttachment = ({ url, alt }: { url: string; alt: string }) => {
  const [view, setView] = useState(false);
  const handleDownload = (e: any) => { e.stopPropagation(); window.open(url, '_blank'); };

  if (!view) {
    return (
      <div 
        onClick={() => setView(true)}
        className="w-48 h-32 bg-base-200 rounded-lg cursor-pointer hover:bg-base-300 transition relative overflow-hidden group border border-base-300 flex flex-col items-center justify-center gap-2"
      >
        <div className="text-error p-3 bg-white rounded-full shadow-sm"><FileText size={24} /></div>
        <span className="text-xs font-medium truncate max-w-[90%] px-2">PDF Document</span>
        
        <div className="absolute inset-0 bg-black/5 hover:bg-black/10 transition flex items-center justify-center opacity-0 group-hover:opacity-100 backdrop-blur-[1px]">
             <span className="text-xs font-bold bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded shadow text-base-content">Click to Preview</span>
        </div>
        <button onClick={handleDownload} className="absolute top-1 right-1 btn btn-xs btn-circle btn-ghost bg-slate-100 dark:bg-slate-900/80 hover:bg-slate-100 dark:bg-slate-900 opacity-0 group-hover:opacity-100 transition shadow-sm" title="Download"><Download size={12} /></button>
      </div>
    );
  }

  return (
    <div className="w-full relative group my-2">
      <div className="flex justify-between items-center mb-2">
         <span className="text-sm font-bold opacity-70 flex items-center gap-2"><Eye size={14} /> PDF Preview</span>
         <button onClick={() => setView(false)} className="btn btn-xs btn-ghost">Close Preview</button>
      </div>
      <iframe src={url} className="w-full h-[500px] rounded-lg border border-base-300 bg-base-200" title={alt}></iframe>
      <div className="absolute top-10 right-4">
        <button onClick={handleDownload} className="btn btn-sm btn-circle bg-slate-100 dark:bg-slate-900 shadow-md hover:bg-base-200" title="Download Original"><Download size={16} /></button>
      </div>
    </div>
  );
}

const ImageAttachment = ({ url, alt }: { url: string; alt: string }) => {
  const [view, setView] = useState(false);
  const handleDownload = (e: any) => { e.stopPropagation(); window.open(url, '_blank'); };

  if (!view) {
    return (
      <div 
        onClick={() => setView(true)}
        className="w-48 h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl cursor-pointer transition-all relative overflow-hidden group border border-base-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-primary/50"
      >
        <img src={url} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center backdrop-blur-[2px]">
             <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-xl shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Click to view</span>
             </div>
        </div>
        <button onClick={handleDownload} className="absolute top-2 right-2 btn btn-xs btn-circle bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white opacity-0 group-hover:opacity-100 transition shadow-lg"><Download size={12} /></button>
      </div>
    );
  }

  return (
    <div className="relative group w-full my-4 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex justify-end mb-2 items-center gap-2">
         <button onClick={handleDownload} className="btn btn-xs btn-ghost gap-2 opacity-50 hover:opacity-100 font-bold uppercase tracking-widest text-[9px]"><Download size={14} /> Download Original</button>
         <button onClick={() => setView(false)} className="btn btn-xs btn-ghost gap-2 opacity-50 hover:opacity-100 font-bold uppercase tracking-widest text-[9px]"><Eye size={14} /> Close Preview</button>
      </div>
      <div className="rounded-3xl overflow-hidden border border-base-200 dark:border-slate-800 shadow-2xl bg-slate-50 dark:bg-slate-950 flex justify-center">
        <img src={url} alt={alt} className="max-w-full max-h-[700px] w-auto" />
      </div>
    </div>
  );
};

const FileAttachment = ({ file }: { file: any }) => {
  const isImage = file.mimeType.startsWith('image/');
  const isPdf = file.mimeType === 'application/pdf';
  if (isImage) return <ImageAttachment url={file.url} alt={file.originalName} />;
  if (isPdf) return <PdfAttachment url={file.url} alt={file.originalName} />;

  return (
    <div className="flex items-center gap-3 p-3 border border-base-300 rounded-lg bg-slate-100 dark:bg-slate-900 max-w-sm hover:bg-base-50 transition">
      <div className="w-10 h-10 rounded bg-base-200 flex items-center justify-center shrink-0 text-base-content/50"><FileText size={20} /></div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{file.originalName}</div>
        <div className="text-xs opacity-60">{(file.size / 1024).toFixed(1)} KB</div>
      </div>
      <a href={file.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm btn-circle"><Download size={16} /></a>
    </div>
  );
};

export default function TaskDetailsModal({ taskId, isOpen, onClose }: TaskDetailsModalProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [commentText, setCommentText] = useState('');
  const [commentFiles, setCommentFiles] = useState<File[]>([]);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isPriorityOpen, setIsPriorityOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  //  Editing State 
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [tempDescription, setTempDescription] = useState('');

  //  Fetch Data 
  const { data: task, isLoading: taskLoading, error: taskError } = useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      const resp = (await taskApi.get(`/${taskId}`)).data;
      setTempTitle(resp.title);
      setTempDescription(resp.description || '');
      return resp;
    },
    enabled: isOpen && !!taskId,
    retry: false
  });

  const { data: comments, isLoading: commentsLoading } = useQuery({
    queryKey: ['comments', taskId],
    queryFn: async () => (await taskApi.get(`/${taskId}/comments`)).data,
    enabled: isOpen && !!taskId && !taskError,
  });

  const { data: team } = useQuery({
    queryKey: ['team', task?.teamId],
    queryFn: async () => (await teamApi.get(`/${task.teamId}`)).data,
    enabled: !!task?.teamId,
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await userApi.get('')).data,
    enabled: isOpen,
  });

  const getAssigneeNames = () => users?.filter((u: any) => task?.assigneeIds?.includes(u.id)) || [];
  const getCreatorName = () => users?.find((u: any) => u.id === task?.creatorId)?.fullName || 'Unknown';
  const isAuthorizedToEdit = user?.id === task?.creatorId || user?.id === team?.leaderId;

  //  File Handling 
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const validFiles: File[] = [];
      const MAX_SIZE = 2 * 1024 * 1024; // 2MB
      const MAX_FILES = 5;
      const ALLOWED_EXTENSIONS = ['webp', 'jpg', 'jpeg', 'zip', 'rar', '7z', 'pdf', 'txt'];

      const currentCount = commentFiles.length;
      if (currentCount + newFiles.length > MAX_FILES) {
        toast.error(`You can only attach up to ${MAX_FILES} files.`);
        return;
      }

      for (const file of newFiles) {
        if (file.size > MAX_SIZE) {
          toast.error(`"${file.name}" exceeds 2MB limit.`);
          continue;
        }

        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            toast.error(`Invalid file type: ${file.name}`);
            continue;
        }

        validFiles.push(file);
      }

      setCommentFiles(prev => [...prev, ...validFiles]);
    }
     if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setCommentFiles(prev => prev.filter((_, i) => i !== index));
  };

  //  Mutations 
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => taskApi.patch(`/${taskId}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['task', taskId] });
      toast.success('Status updated');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => taskApi.delete(`/${taskId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task deleted');
      onClose();
    }
  });

  const commentMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('text', commentText);
      formData.append('creatorName', user?.fullName || 'User');
      
      commentFiles.forEach((file) => {
        formData.append('files', file);
      });

      return taskApi.post(`/${taskId}/comments`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', taskId] });
      setCommentText('');
      setCommentFiles([]);
      toast.success('Comment added');
    },
    onError: () => toast.error('Failed to post comment')
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (payload: any) => taskApi.patch(`/${taskId}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['task', taskId] });
      setIsEditingTitle(false);
      setIsEditingDescription(false);
      toast.success('Task updated');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to update task');
    }
  });

  const getPriorityInfo = (p: string) => {
    switch(p) {
        case 'HIGH': return { color: 'text-rose-500', bg: 'bg-rose-500/10', label: 'High Priority' };
        case 'MEDIUM': return { color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Medium Priority' };
        default: return { color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Low Priority' };
    }
  };

  const getStatusInfo = (status: string) => {
    switch(status) {
        case 'DONE': return { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Completed' };
        case 'IN_PROGRESS': return { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'In Progress' };
        default: return { icon: CircleDot, color: 'text-slate-400', bg: 'bg-slate-500/10', label: 'To Do' };
    }
  };

  if (!isOpen) return null;

  const { icon: StatusIcon } = getStatusInfo(task?.status || 'TODO');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden relative"
        onClick={e => e.stopPropagation()}
      >
        
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-white dark:bg-slate-900 shrink-0 relative z-30">
          <div className="flex-1 pr-8">
            <div className="flex flex-col gap-4 mb-4">
               <div className="flex items-center flex-wrap gap-3">
                  <div className={clsx("w-fit pl-2 pr-4 py-1.5 rounded-full flex items-center gap-2 border bg-white dark:bg-slate-900 shadow-sm border-opacity-20", task?.status === 'TODO' ? 'text-slate-500' : task?.status === 'IN_PROGRESS' ? 'text-amber-500' : 'text-emerald-500')}>
                    <StatusIcon size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">{(task?.status || 'TODO').replace('_', ' ')}</span>
                  </div>
                  <div className="relative">
                    <button 
                      onClick={() => isAuthorizedToEdit && setIsPriorityOpen(!isPriorityOpen)}
                      disabled={!isAuthorizedToEdit}
                      className={clsx(
                        "w-fit badge font-black uppercase tracking-widest text-[8px] py-3 px-3 rounded-lg shadow-sm border-0 transition-all",
                        getPriorityInfo(task?.priority || 'MEDIUM').bg,
                        getPriorityInfo(task?.priority || 'MEDIUM').color,
                        isAuthorizedToEdit && "hover:scale-105 cursor-pointer"
                      )}
                    >
                      {task?.priority} Priority
                    </button>

                    {isPriorityOpen && (
                      <div className="absolute top-full left-0 mt-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-[60] min-w-[150px] animate-in fade-in slide-in-from-top-2">
                        {['LOW', 'MEDIUM', 'HIGH'].map((p) => (
                           <button
                            key={p}
                            onClick={() => {
                              updateTaskMutation.mutate({ priority: p });
                              setIsPriorityOpen(false);
                            }}
                            className={clsx(
                              "w-full text-left px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors",
                              task.priority === p ? "bg-primary/5 text-primary" : "hover:bg-slate-50 dark:hover:bg-slate-800"
                            )}
                           >
                            {p}
                           </button>
                        ))}
                      </div>
                    )}
                  </div>
               </div>
                <div className="mt-1 flex items-start gap-3 group/title">
                   {isEditingTitle ? (
                      <div className="flex-1 flex gap-2">
                        <input 
                          value={tempTitle} 
                          onChange={(e) => setTempTitle(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-primary/30 rounded-2xl px-5 py-3 text-2xl font-black font-['Outfit'] tracking-tighter outline-none focus:ring-4 focus:ring-primary/5 transition-all text-slate-900 dark:text-white"
                          autoFocus
                        />
                        <button 
                          onClick={() => updateTaskMutation.mutate({ title: tempTitle })}
                          disabled={updateTaskMutation.isPending}
                          className="btn-premium-glow flex-shrink-0"
                        >
                           <div className="btn-premium-inner px-4 py-3 rounded-2xl">
                             {updateTaskMutation.isPending ? <span className="loading loading-spinner loading-xs"></span> : <Check size={24} />}
                           </div>
                        </button>
                        <button onClick={() => { setIsEditingTitle(false); setTempTitle(task.title); }} className="btn btn-ghost btn-circle rounded-2xl">
                          <X size={24} />
                        </button>
                      </div>
                   ) : (
                      <>
                        <div className="flex-1">
                          <h2 className="text-4xl font-black font-['Outfit'] tracking-tighter leading-tight mb-2 flex items-center gap-4 text-slate-900 dark:text-white">
                            {task?.title}
                            {isAuthorizedToEdit && (
                               <button 
                                onClick={() => setIsEditingTitle(true)}
                                className="opacity-0 group-hover/title:opacity-100 btn btn-ghost btn-xs btn-circle hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                               >
                                <Edit2 size={12} />
                               </button>
                            )}
                          </h2>
                          <div className="flex items-center gap-3">
                               <div className="flex items-center gap-1.5 opacity-30">
                                  <Calendar size={12} />
                                  <span className="text-[10px] font-bold uppercase tracking-widest leading-none">
                                    Created {new Date(task?.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                  </span>
                               </div>
                          </div>
                        </div>
                      </>
                   )}
                </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            {isAuthorizedToEdit && (
              <button 
                onClick={() =>  window.confirm('Delete this task?') && deleteMutation.mutate()}
                className="btn btn-ghost btn-circle text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                title="Delete Task"
              >
                <Trash2 size={20} />
              </button>
            )}
            <button onClick={onClose} className="btn btn-ghost btn-circle hover:bg-slate-100 dark:hover:bg-slate-800 transition"><X size={24} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
          
          <div className="flex-1 p-8 space-y-10 overflow-y-auto no-scrollbar">
             {taskLoading ? (
               <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg text-primary"></span></div>
             ) : taskError ? (
               <div className="bg-rose-50 dark:bg-rose-500/5 text-rose-600 dark:text-rose-400 p-8 rounded-[2rem] text-center font-bold border border-rose-100 dark:border-rose-500/20">Access Denied or Not Found</div>
             ) : (
               <>
                 <div className="space-y-6">
                    <div className="flex items-center justify-between">
                       <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Documentation</h3>
                       {isAuthorizedToEdit && !isEditingDescription && (
                          <button 
                           onClick={() => setIsEditingDescription(true)}
                           className="btn btn-ghost btn-xs gap-2 opacity-30 hover:opacity-100 font-black uppercase tracking-widest text-[9px] transition-all hover:translate-x-1"
                          >
                           <Edit2 size={12} /> Edit Documentation
                          </button>
                       )}
                       {isEditingDescription && (
                          <div className="flex gap-3">
                             <button 
                              onClick={() => updateTaskMutation.mutate({ description: tempDescription })}
                              disabled={updateTaskMutation.isPending}
                              className="btn-premium-glow group overflow-hidden"
                             >
                                <div className="btn-premium-inner px-5 py-2 flex items-center gap-2">
                                   {updateTaskMutation.isPending ? <span className="loading loading-spinner loading-xs"></span> : <Save size={14} />}
                                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">Save Changes</span>
                                </div>
                             </button>
                             <button 
                              onClick={() => { setIsEditingDescription(false); setTempDescription(task.description || ''); }}
                              className="btn btn-ghost btn-xs gap-2 rounded-lg font-black uppercase tracking-widest text-[9px] opacity-40 hover:opacity-100"
                             >
                              Cancel
                             </button>
                          </div>
                       )}
                    </div>
                    
                    <div className="transition-all duration-300">
                       <RichTextEditor 
                        content={isEditingDescription ? tempDescription : (task.description || '')} 
                        onChange={(html) => setTempDescription(html)}
                        editable={isEditingDescription}
                         minHeight={isEditingDescription ? "250px" : "100px"}
                       />
                    </div>
                 </div>

                 {task.attachments.length > 0 && (
                   <div className="bg-slate-50 dark:bg-slate-950/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                     <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-4 flex items-center gap-2"><Paperclip size={14} /> Attachments</h3>
                     <div className="flex flex-wrap gap-4">
                       {task.attachments.map((att: any, i: number) => <FileAttachment key={i} file={att} />)}
                     </div>
                   </div>
                 )}

                 <div className="border-t border-slate-100 dark:border-slate-800 pt-10">
                    <h3 className="text-xl font-black font-['Outfit'] tracking-tight mb-8 flex items-center gap-3 text-slate-900 dark:text-white">Discussion <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-500 border-0 font-black rounded-lg text-xs leading-none py-1 h-auto">{comments?.length || 0}</span></h3>

                    <div className="space-y-8 mb-10">
                       {commentsLoading && <div className="flex justify-center py-10"><span className="loading loading-spinner text-primary"></span></div>}
                       {!commentsLoading && comments?.map((comment: any) => (
                         <div key={comment._id} className="flex gap-5 group">
                           <div className="avatar placeholder shrink-0 self-start">
                             <div className="bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl w-12 h-12 flex items-center justify-center text-center shadow-inner">
                               <span className="text-xl uppercase font-black">{comment.creatorName[0]}</span>
                             </div>
                           </div>
                           <div className="flex-1">
                             <div className="flex items-baseline justify-between mb-2">
                               <span className="font-black text-sm text-slate-900 dark:text-white tracking-tight">{comment.creatorName}</span>
                               <span className="text-[10px] font-bold opacity-30 uppercase tracking-widest">{new Date(comment.createdAt).toLocaleString()}</span>
                             </div>
                             <div className="relative bg-slate-50 dark:bg-slate-950/30 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                               <RichTextEditor content={comment.text} editable={false} />
                               {comment.attachments && comment.attachments.length > 0 && (
                                 <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-3">
                                    {comment.attachments.map((att: any, i: number) => <FileAttachment key={i} file={att} />)}
                                 </div>
                               )}
                             </div>
                           </div>
                         </div>
                       ))}
                       {comments?.length === 0 && <p className="text-center opacity-30 py-10 italic text-sm">No collaborative notes yet.</p>}
                    </div>

                    {user?.role !== 'ADMIN' && (
                      <div className="flex gap-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2.5rem] shadow-xl">
                         <div className="avatar placeholder self-start">
                            <div className="bg-slate-100 dark:bg-slate-800 text-primary rounded-2xl w-12 h-12 flex items-center justify-center font-black text-xl shadow-inner"><span>{user?.fullName[0]}</span></div>
                         </div>
                         <div className="flex-1 space-y-4">
                            <input 
                              type="file" 
                              multiple 
                              className="hidden" 
                              ref={fileInputRef}
                              onChange={handleFileSelect}
                              accept=".webp,.jpg,.jpeg,.zip,.rar,.7z,.pdf,.txt"
                            />
                            
                            <RichTextEditor 
                              content={commentText} 
                              onChange={setCommentText} 
                              onAttach={() => fileInputRef.current?.click()}
                              minHeight="80px"
                            />
                            
                            
                            {commentFiles.length > 0 && (
                               <div className="flex flex-wrap gap-2 pt-2 animate-in fade-in slide-in-from-top-2">
                                  {commentFiles.map((file, i) => (
                                     <div key={i} className="badge badge-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 gap-2 pl-3 pr-2 py-4 h-auto rounded-xl">
                                        <div className="flex flex-col items-start leading-none max-w-[150px]">
                                            <span className="text-[10px] font-black truncate w-full">{file.name}</span>
                                            <span className="text-[8px] opacity-40 uppercase">{(file.size/1024).toFixed(1)} KB</span>
                                        </div>
                                        <button onClick={() => removeFile(i)} className="btn btn-xs btn-circle btn-ghost hover:bg-rose-500 hover:text-white transition-all"><X size={14} /></button>
                                     </div>
                                  ))}
                                  <div className="text-[9px] font-black uppercase opacity-30 flex items-center ml-2">{commentFiles.length}/5 files</div>
                               </div>
                            )}

                            <div className="flex justify-end pt-2">
                               <button 
                                 onClick={() => commentMutation.mutate()}
                                 className="btn-premium-glow group overflow-hidden"
                                 disabled={commentMutation.isPending || (!commentText && commentFiles.length === 0)}
                               >
                                  <div className="btn-premium-inner px-8 py-2.5 flex items-center gap-3">
                                     {commentMutation.isPending ? <span className="loading loading-spinner loading-xs"></span> : <Send size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                                     <span className="text-[11px] font-black uppercase tracking-widest">Post Comment</span>
                                  </div>
                               </button>
                            </div>
                         </div>
                      </div>
                    )}
                 </div>
               </>
             )}
          </div>

          
          <div className="w-full md:w-96 bg-slate-50 dark:bg-slate-950/20 p-8 space-y-10 overflow-y-auto no-scrollbar">
             {task && (
                <>
                 
                 <div className="relative">
                   <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-4 p-1">Status</h4>
                   <button 
                    onClick={() => user?.role !== 'ADMIN' && setIsStatusOpen(!isStatusOpen)}
                    disabled={user?.role === 'ADMIN'}
                    className={clsx(
                      "w-full flex items-center justify-between gap-4 p-5 rounded-[2rem] border transition-all duration-300 group shadow-sm bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800",
                      !isStatusOpen && "hover:border-primary/30 hover:shadow-xl",
                      isStatusOpen && "ring-4 ring-primary/5 border-primary/30 shadow-xl"
                    )}
                   >
                      <div className="flex items-center gap-4">
                        <div className={clsx("w-10 h-10 rounded-2xl flex items-center justify-center shadow-inner", getStatusInfo(task?.status || 'TODO').bg, getStatusInfo(task?.status || 'TODO').color)}>
                          <StatusIcon size={20} />
                        </div>
                        <span className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">
                          {getStatusInfo(task?.status || 'TODO').label}
                        </span>
                      </div>
                      <X size={16} className={clsx("opacity-20 transition-transform duration-300", isStatusOpen ? "rotate-0" : "rotate-45")} />
                   </button>

                   {isStatusOpen && (
                     <div className="absolute top-full left-0 w-full mt-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                        {['TODO', 'IN_PROGRESS', 'DONE'].map((s) => {
                          const info = getStatusInfo(s);
                          const Icon = info.icon;
                          return (
                            <button
                              key={s}
                              onClick={() => {
                                updateStatusMutation.mutate(s);
                                setIsStatusOpen(false);
                              }}
                              className={clsx(
                                "w-full flex items-center gap-4 p-4 rounded-3xl transition-all duration-200 group/item",
                                task.status === s ? "bg-slate-50 dark:bg-slate-950/5 text-primary" : "hover:bg-slate-200 dark:hover:bg-slate-800/50"
                              )}
                            >
                               <div className={clsx("w-10 h-10 rounded-2xl flex items-center justify-center transition-all group-hover/item:scale-110 shadow-inner", info.bg, info.color)}>
                                  <Icon size={20} />
                               </div>
                               <span className="text-xs font-black uppercase tracking-widest">{info.label}</span>
                               {task.status === s && <Check size={16} className="ml-auto" />}
                            </button>
                          );
                        })}
                     </div>
                   )}
                 </div>

                 <div className="space-y-8">
                    <div>
                       <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-4 px-1">Assignees</h4>
                       <div className="space-y-3">
                          {getAssigneeNames().map((u: any) => (
                            <div key={u.id} className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                               <div className="avatar placeholder">
                                 <div className="bg-slate-100 dark:bg-slate-800 text-primary w-10 h-10 rounded-xl font-black text-sm flex items-center justify-center shadow-inner">
                                   <span>{u.fullName[0]}</span>
                                 </div>
                               </div>
                               <div className="flex flex-col">
                                 <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white">{u.fullName}</span>
                                 <span className="text-[10px] opacity-30 font-bold uppercase tracking-widest">Collaborator</span>
                               </div>
                            </div>
                          ))}
                          {getAssigneeNames().length === 0 && (
                            <div className="p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] text-center">
                              <span className="text-[10px] font-black uppercase tracking-widest opacity-20">No assigned nodes</span>
                            </div>
                          )}
                       </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                       <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-transform hover:-translate-y-1">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-3 flex items-center gap-2">
                            <Calendar size={12} className="text-primary" /> Due Date
                          </h4>
                           <span className="text-xs font-black tracking-widest uppercase text-slate-900 dark:text-white">
                             {task?.deadline ? new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No Deadline'}
                           </span>
                       </div>

                       <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-3">Created By</h4>
                          <div className="flex items-center gap-3">
                             <div className="avatar placeholder">
                                 <div className="bg-slate-100 dark:bg-slate-800 text-slate-500 w-8 h-8 rounded-lg font-black text-xs flex items-center justify-center shadow-inner">
                                     <span>{getCreatorName()[0]}</span>
                                 </div>
                             </div>
                             <span className="text-xs font-black tracking-tight text-slate-900 dark:text-white">{getCreatorName()}</span>
                          </div>
                       </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                        <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
                            <div className="w-8 h-8 bg-white dark:bg-slate-900 rounded-lg flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-800">
                               <Clock size={14} className="text-primary" />
                            </div>
                            <div className="flex flex-col">
                               <span className="text-[9px] font-black uppercase tracking-widest opacity-50">Created on</span>
                               <span className="text-xs font-mono font-bold">{new Date(task.createdAt).toLocaleString()}</span>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
                            <div className="w-8 h-8 bg-white dark:bg-slate-900 rounded-lg flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-800">
                               <Edit2 size={14} className="text-amber-500" />
                            </div>
                            <div className="flex flex-col">
                               <span className="text-[9px] font-black uppercase tracking-widest opacity-50">Last Update</span>
                               <span className="text-xs font-mono font-bold">{new Date(task.updatedAt).toLocaleString()}</span>
                            </div>
                        </div>
                     </div>
                 </div>
                </>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
