import React, { useState, useRef } from 'react';
import { Send, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Comment } from '../../types';
import RichTextEditor from '../RichTextEditor';
import { FileAttachment } from './TaskAttachmentView';

interface TaskCommentsSectionProps {
  comments?: Comment[];
  isLoading: boolean;
  onAddComment: (text: string, files: File[]) => void;
  isPosting: boolean;
}

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_FILES = 5;
const ALLOWED_EXTENSIONS = ['webp', 'jpg', 'jpeg', 'zip', 'rar', '7z', 'pdf', 'txt'];

export const TaskCommentsSection: React.FC<TaskCommentsSectionProps> = ({
  comments = [],
  isLoading,
  onAddComment,
  isPosting,
}) => {
  const [commentText, setCommentText] = useState('');
  const [commentFiles, setCommentFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const validFiles: File[] = [];

      if (commentFiles.length + newFiles.length > MAX_FILES) {
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

      setCommentFiles((prev) => [...prev, ...validFiles]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setCommentFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!commentText.trim() && commentFiles.length === 0) return;
    onAddComment(commentText, commentFiles);
    setCommentText('');
    setCommentFiles([]);
  };

  return (
    <div className="pt-8">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-bold font-['Outfit'] flex items-center gap-3">
          Discussion
          <span className="bg-base-200 text-base-content/60 text-xs py-1 px-2.5 rounded-full font-black min-w-[24px] text-center">
            {comments.length}
          </span>
        </h3>
      </div>

      <div className="space-y-8 mb-10 pl-4 border-l-2 border-base-200 dark:border-slate-800 ml-2">
        {isLoading && (
          <div className="py-4">
            <span className="loading loading-dots loading-md opacity-50"></span>
          </div>
        )}

        {!isLoading &&
          comments.map((comment) => (
            <div key={comment._id} className="relative pl-6 group">
              <div className="absolute -left-[29px] top-0 bg-white dark:bg-slate-900 border-2 border-base-200 dark:border-slate-800 rounded-full p-1 z-10 group-hover:border-primary transition-colors">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black text-base-content/70">
                  {comment.creatorName ? comment.creatorName[0]?.toUpperCase() : 'U'}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-sm text-base-content">{comment.creatorName}</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider opacity-40">
                    {new Date(comment.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950/50 border border-base-200 dark:border-slate-800/50 rounded-2xl p-4 rounded-tl-none">
                  <RichTextEditor content={comment.text} editable={false} />
                  {comment.attachments && comment.attachments.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-base-200/50 flex flex-wrap gap-2">
                      {comment.attachments.map((att, i) => (
                        <FileAttachment key={att._id || i} file={att} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

        {!isLoading && comments.length === 0 && (
          <p className="text-sm opacity-40 italic pl-2">Start the conversation...</p>
        )}
      </div>

      {/* Comment Input */}
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
            {commentFiles.length > 0 &&
              commentFiles.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-base-200 rounded-lg px-2 py-1 text-xs shadow-sm shrink-0"
                >
                  <span className="truncate max-w-[100px] font-medium">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="hover:text-error transition"
                    title="Remove file"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            className="btn-premium-glow group overflow-hidden w-full sm:w-auto"
            disabled={isPosting || (!commentText.trim() && commentFiles.length === 0)}
          >
            <div className="btn-premium-inner px-8 py-2.5 flex items-center justify-center gap-3">
              {isPosting ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                <Send
                  size={16}
                  className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
                />
              )}
              <span className="text-[11px] font-black uppercase tracking-widest">Post Comment</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskCommentsSection;
