import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi, userApi, teamApi } from '../api/axios';
import { Trash2, Calendar, Paperclip, Download, Send, FileText, Eye, ArrowLeft, CheckCircle2, Clock, CircleDot, Edit2, Check, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';
import RichTextEditor from '../components/RichTextEditor';

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

export default function TaskDetail() {
  const { taskId } = useParams();
  const navigate = useNavigate();
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
    enabled: !!taskId,
    retry: false
  });

  const { data: comments, isLoading: commentsLoading } = useQuery({
    queryKey: ['comments', taskId],
    queryFn: async () => (await taskApi.get(`/${taskId}/comments`)).data,
    enabled: !!taskId && !taskError,
  });

  const { data: team } = useQuery({
    queryKey: ['team', task?.teamId],
    queryFn: async () => (await teamApi.get(`/${task.teamId}`)).data,
    enabled: !!task?.teamId,
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await userApi.get('')).data,
  });

  const getAssigneeNames = () => users?.filter((u: any) => task?.assigneeIds?.includes(u.id)) || [];
  const getCreatorName = () => users?.find((u: any) => u.id === task?.creatorId)?.fullName || 'Unknown';
  const isAuthorizedToEdit = user?.id === task?.creatorId || user?.id === team?.leaderId || user?.role === 'ADMIN';
  
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

  const deleteMutation = useMutation({
    mutationFn: async () => taskApi.delete(`/${taskId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task deleted');
      navigate('/');
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

  if (taskLoading) return (
    <div className="flex h-screen items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
    </div>
  );

  if (taskError) return (
    <div className="flex bg-slate-50 dark:bg-slate-950 h-screen items-center justify-center p-4">
        <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full border border-base-200">
            <h2 className="text-2xl font-black font-['Outfit'] mb-2">Access Denied</h2>
            <p className="opacity-60 mb-6 font-['Inter']">This task doesn't exist or you don't have permission to view it.</p>
            <button onClick={() => navigate('/')} className="btn btn-primary w-full">Back to Dashboard</button>
        </div>
    </div>
  );

  const { icon: StatusIcon } = getStatusInfo(task.status);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 font-['Inter']">
       <div className="max-w-7xl mx-auto bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-base-200 dark:border-slate-800 overflow-hidden flex flex-col md:flex-row min-h-[85vh] animate-in fade-in duration-300">
          
          
          <div className="flex-1 flex flex-col min-w-0">
             
             <div className="p-6 md:p-8 border-b border-base-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-20">
                <div className="flex items-start justify-between gap-4 mb-6">
                    <button onClick={() => navigate(-1)} className="btn btn-ghost btn-circle btn-sm hover:bg-base-200 -ml-2 text-base-content/60"><ArrowLeft size={20} /></button>
                    <span className="text-xs font-mono opacity-40 font-bold tracking-widest">#{taskId?.slice(-6)}</span>
                        {isAuthorizedToEdit && (
                            <button 
                                onClick={() =>  window.confirm('Delete this task irrevocably?') && deleteMutation.mutate()}
                                className="btn btn-ghost btn-circle btn-xs text-rose-500 hover:bg-rose-50"
                                title="Delete Task"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                </div>

                <div className="flex flex-col gap-4">
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
                    <div className="mt-1 flex items-start gap-4 group/title">
                        {isEditingTitle ? (
                            <div className="flex-1 flex gap-3">
                                <input 
                                    value={tempTitle} 
                                    onChange={(e) => setTempTitle(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-950 border-b-4 border-primary rounded-none px-0 py-2 text-4xl md:text-6xl font-black font-['Outfit'] tracking-tighter outline-none"
                                    autoFocus
                                />
                                <div className="flex flex-col gap-2">
                                    <button 
                                        onClick={() => updateTaskMutation.mutate({ title: tempTitle })}
                                        disabled={updateTaskMutation.isPending}
                                        className="btn btn-primary btn-square rounded-2xl shadow-xl"
                                    >
                                        {updateTaskMutation.isPending ? <span className="loading loading-spinner loading-xs"></span> : <Check size={24} />}
                                    </button>
                                    <button onClick={() => { setIsEditingTitle(false); setTempTitle(task.title); }} className="btn btn-ghost btn-square rounded-2xl">
                                        <X size={24} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1">
                                <h1 className="text-4xl md:text-6xl font-black font-['Outfit'] leading-none tracking-tighter text-base-content transform -translate-x-1 mb-3 flex items-center gap-4">
                                    {task?.title}
                                    {isAuthorizedToEdit && (
                                        <button 
                                            onClick={() => setIsEditingTitle(true)}
                                            className="opacity-0 group-hover/title:opacity-100 btn btn-ghost btn-sm btn-square hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                    )}
                                </h1>
                            </div>
                        )}
                    </div>
                </div>
             </div>

             
             <div className="p-6 md:p-8 space-y-8 flex-1 overflow-y-auto">
                 <div className="space-y-4">
                    <div className="flex items-center justify-between">
                       <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Task Documentation</h3>
                       {isAuthorizedToEdit && !isEditingDescription && (
                          <button 
                           onClick={() => setIsEditingDescription(true)}
                           className="btn btn-ghost btn-xs gap-2 opacity-40 hover:opacity-100 font-black uppercase tracking-widest text-[9px]"
                          >
                           <Edit2 size={12} /> Edit Documentation
                          </button>
                       )}
                       {isEditingDescription && (
                          <div className="flex gap-2">
                             <button 
                              onClick={() => updateTaskMutation.mutate({ description: tempDescription })}
                              disabled={updateTaskMutation.isPending}
                              className="btn btn-primary btn-xs gap-2 rounded-lg font-black uppercase tracking-widest text-[9px]"
                             >
                              {updateTaskMutation.isPending ? <span className="loading loading-spinner loading-xs"></span> : <Save size={12} />} Save Changes
                             </button>
                             <button 
                              onClick={() => { setIsEditingDescription(false); setTempDescription(task.description || ''); }}
                              className="btn btn-ghost btn-xs gap-2 rounded-lg font-black uppercase tracking-widest text-[9px]"
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
                        minHeight={isEditingDescription ? "300px" : "auto"}
                       />
                    </div>
                 </div>

                 {task.attachments.length > 0 && (
                   <div className="bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-6 border border-base-200 dark:border-slate-800/50">
                     <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-40 mb-4 flex items-center gap-2 font-['Outfit']"><Paperclip size={14} /> Attachments</h3>
                     <div className="flex flex-wrap gap-4">
                       {task.attachments.map((att: any, i: number) => <FileAttachment key={i} file={att} />)}
                     </div>
                   </div>
                 )}

                 <div className="pt-8">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold font-['Outfit'] flex items-center gap-3">
                            Discussion 
                            <span className="bg-base-200 text-base-content/60 text-xs py-1 px-2.5 rounded-full font-black min-w-[24px] text-center">{comments?.length || 0}</span>
                        </h3>
                    </div>

                    <div className="space-y-8 mb-10 pl-4 border-l-2 border-base-200 dark:border-slate-800 ml-2">
                       {commentsLoading && <div className="py-4"><span className="loading loading-dots loading-md opacity-50"></span></div>}
                       {!commentsLoading && comments?.map((comment: any) => (
                         <div key={comment._id} className="relative pl-6 group">
                           <div className="absolute -left-[29px] top-0 bg-white dark:bg-slate-900 border-2 border-base-200 dark:border-slate-800 rounded-full p-1 z-10 group-hover:border-primary transition-colors">
                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black text-base-content/70">
                                    {comment.creatorName[0]}
                                </div>
                           </div>
                           <div className="flex flex-col gap-2">
                             <div className="flex items-center gap-2 mb-1">
                               <span className="font-bold text-sm text-base-content">{comment.creatorName}</span>
                               <span className="text-[10px] uppercase font-bold tracking-wider opacity-40">{new Date(comment.createdAt).toLocaleString()}</span>
                             </div>
                             <div className="bg-slate-50 dark:bg-slate-950/50 border border-base-200 dark:border-slate-800/50 rounded-2xl p-4 rounded-tl-none">
                                <RichTextEditor content={comment.text} editable={false} />
                                {comment.attachments && comment.attachments.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-base-200/50 flex flex-wrap gap-2">
                                        {comment.attachments.map((att: any, i: number) => <FileAttachment key={i} file={att} />)}
                                    </div>
                                )}
                             </div>
                           </div>
                         </div>
                       ))}
                       {comments?.length === 0 && <p className="text-sm opacity-40 italic pl-2">Start the conversation...</p>}
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-base-200 dark:border-slate-800 rounded-2xl p-1 shadow-sm transition-all">
                         <div className="p-3 border-b border-base-100">
                            <RichTextEditor 
                              content={commentText} 
                              onChange={setCommentText} 
                              onAttach={() => fileInputRef.current?.click()}
                            />
                         </div>
                         
                         <div className="p-3 bg-slate-50 dark:bg-slate-950/30 rounded-b-xl flex justify-between items-center">
                            <div className="flex gap-2 overflow-x-auto max-w-[60%] no-scrollbar">
                                <input 
                                  type="file" 
                                  multiple 
                                  className="hidden" 
                                  ref={fileInputRef}
                                  onChange={handleFileSelect}
                                  accept=".webp,.jpg,.jpeg,.zip,.rar,.7z,.pdf,.txt"
                                />
                                {commentFiles.length > 0 && (
                                   commentFiles.map((file, i) => (
                                      <div key={i} className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-base-200 rounded-lg px-2 py-1 text-xs shadow-sm shrink-0">
                                          <span className="truncate max-w-[100px] font-medium">{file.name}</span>
                                          <button onClick={() => removeFile(i)} className="hover:text-error transition"><Trash2 size={12} /></button>
                                      </div>
                                   ))
                                )}
                            </div>
                            <button 
                                 onClick={() => commentMutation.mutate()}
                                 className="btn-premium-glow group overflow-hidden w-full sm:w-auto"
                                 disabled={commentMutation.isPending || (!commentText && commentFiles.length === 0)}
                            >
                                <div className="btn-premium-inner px-8 py-2.5 flex items-center justify-center gap-3">
                                   {commentMutation.isPending ? <span className="loading loading-spinner loading-xs"></span> : <Send size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                                   <span className="text-[11px] font-black uppercase tracking-widest">Post Comment</span>
                                </div>
                            </button>
                         </div>
                    </div>
                 </div>
             </div>
          </div>

          
          <div className="w-full md:w-96 bg-slate-50/50 dark:bg-slate-900/50 border-l border-base-200 dark:border-slate-800 p-6 md:p-8 space-y-8 h-auto md:h-full overflow-y-auto">
               <div>
                 <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-3 font-['Inter']">Context</h4>
                 
                 <div className="space-y-4">
                    <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-base-200 dark:border-slate-800 shadow-sm relative">
                        <label className="text-[9px] uppercase font-bold tracking-wider opacity-40 mb-2 block">Current Status</label>
                        <button 
                            onClick={() => setIsStatusOpen(!isStatusOpen)}
                            className="w-full flex items-center justify-between gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center", getStatusInfo(task?.status).bg)}>
                                    <StatusIcon size={16} className={getStatusInfo(task?.status).color} />
                                </div>
                                <span className="text-sm font-bold">{getStatusInfo(task?.status).label}</span>
                            </div>
                            <X size={14} className={clsx("opacity-20 transition-transform", isStatusOpen ? "rotate-0" : "rotate-45")} />
                        </button>

                        {isStatusOpen && (
                            <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-4">
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
                                                "w-full flex items-center gap-3 p-3 rounded-xl transition-all",
                                                task.status === s ? "bg-primary/5 text-primary" : "hover:bg-slate-50 dark:hover:bg-slate-800"
                                            )}
                                        >
                                            <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center", info.bg)}>
                                                <Icon size={16} className={info.color} />
                                            </div>
                                            <span className="text-xs font-black uppercase tracking-widest">{info.label}</span>
                                            {task.status === s && <Check size={14} className="ml-auto" />}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-base-200 dark:border-slate-800 shadow-sm">
                       <label className="text-[9px] uppercase font-bold tracking-wider opacity-40 mb-2 block">Team Members</label>
                       <div className="space-y-3">
                           {getAssigneeNames().length > 0 ? (
                               getAssigneeNames().map((u: any) => (
                                   <div key={u.id} className="flex items-center gap-3">
                                       <div className="avatar placeholder">
                                           <div className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center">
                                               {u.fullName[0]}
                                           </div>
                                       </div>
                                       <span className="text-sm font-bold">{u.fullName}</span>
                                   </div>
                               ))
                           ) : (
                               <span className="italic opacity-40 text-sm">No active assignees</span>
                           )}
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-base-200 dark:border-slate-800 shadow-sm">
                             <label className="text-[9px] uppercase font-bold tracking-wider opacity-40 mb-1 block">Creator</label>
                             <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                                    {getCreatorName()[0]}
                                </div>
                                <span className="text-xs font-bold truncate">{getCreatorName()}</span>
                             </div>
                        </div>
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-base-200 dark:border-slate-800 shadow-sm">
                             <label className="text-[9px] uppercase font-bold tracking-wider opacity-40 mb-1 block">Due Date</label>
                             <div className="flex items-center gap-2 truncate text-xs font-bold">
                                <Calendar size={12} className="opacity-50" />
                                {task?.deadline ? new Date(task.deadline).toLocaleDateString() : 'None'}
                             </div>
                        </div>
                    </div>
                 </div>
               </div>
               
               <div className="pt-6 border-t border-base-200 dark:border-slate-800 space-y-4">
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

       </div>
    </div>
  );
}