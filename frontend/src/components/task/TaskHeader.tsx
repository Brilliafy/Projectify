import React, { useState } from 'react';
import { ArrowLeft, Check, Edit2, Trash2, X, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import type { TaskPriority, TaskStatus } from '../../types';
import { getPriorityInfo, getStatusInfo } from './taskHelpers';

interface TaskHeaderProps {
  taskId: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  deadline?: string | null;
  isAuthorized: boolean;
  onUpdateTitle: (title: string) => void;
  onUpdatePriority: (priority: TaskPriority) => void;
  onDelete?: () => void;
  onBackOrClose?: () => void;
  mode: 'page' | 'modal';
  isUpdating?: boolean;
}

const PRIORITIES: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH'];

export const TaskHeader: React.FC<TaskHeaderProps> = ({
  taskId,
  title,
  status,
  priority,
  deadline,
  isAuthorized,
  onUpdateTitle,
  onUpdatePriority,
  onDelete,
  onBackOrClose,
  mode,
  isUpdating = false,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);
  const [isPriorityOpen, setIsPriorityOpen] = useState(false);

  const statusInfo = getStatusInfo(status);
  const StatusIcon = statusInfo.icon;
  const priorityInfo = getPriorityInfo(priority);

  const isDone = status === 'DONE';
  const deadlineDate = deadline ? new Date(deadline) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isOverdue = !isDone && !!deadlineDate && deadlineDate < today;

  const handleSaveTitle = () => {
    if (tempTitle.trim() && tempTitle !== title) {
      onUpdateTitle(tempTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleCancelTitle = () => {
    setTempTitle(title);
    setIsEditingTitle(false);
  };

  return (
    <div className={clsx(
      'p-6 md:p-8 border-b border-base-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-20',
      mode === 'page' && 'sticky top-0'
    )}>
      {/* Top action row */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          {onBackOrClose && (
            <button
              type="button"
              onClick={onBackOrClose}
              className="btn btn-ghost btn-circle btn-sm hover:bg-base-200 -ml-2 text-base-content/60"
              title={mode === 'page' ? 'Back' : 'Close'}
            >
              {mode === 'page' ? <ArrowLeft size={20} /> : <X size={20} />}
            </button>
          )}
          <span className="text-xs font-mono opacity-40 font-bold tracking-widest">
            #{taskId.slice(-6)}
          </span>
        </div>

        {isAuthorized && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="btn btn-ghost btn-circle btn-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            title="Delete Task"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Status & Priority Badges */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center flex-wrap gap-3">
          <div
            className={clsx(
              'w-fit pl-2 pr-4 py-1.5 rounded-full flex items-center gap-2 border bg-white dark:bg-slate-900 shadow-sm border-opacity-20',
              status === 'TODO'
                ? 'text-slate-500'
                : status === 'IN_PROGRESS'
                ? 'text-amber-500'
                : 'text-emerald-500'
            )}
          >
            <StatusIcon size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest leading-none">
              {status.replace('_', ' ')}
            </span>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => isAuthorized && setIsPriorityOpen(!isPriorityOpen)}
              disabled={!isAuthorized || isUpdating}
              className={clsx(
                'w-fit badge font-black uppercase tracking-widest text-[8px] py-3 px-3 rounded-lg shadow-sm border-0 transition-all',
                priorityInfo.bg,
                priorityInfo.color,
                isAuthorized && 'hover:scale-105 cursor-pointer'
              )}
            >
              {priority} Priority
            </button>

            {isPriorityOpen && (
              <div className="absolute top-full left-0 mt-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-[60] min-w-[150px] animate-in fade-in slide-in-from-top-2">
                {PRIORITIES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      onUpdatePriority(p);
                      setIsPriorityOpen(false);
                    }}
                    className={clsx(
                      'w-full text-left px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors',
                      priority === p ? 'bg-primary/5 text-primary' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>

          {isOverdue && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-[9px] font-black uppercase tracking-widest">
              <AlertCircle size={13} className="text-rose-500 shrink-0" />
              <span>Overdue</span>
            </div>
          )}
        </div>

        {/* Title row */}
        <div className="mt-1 flex items-start gap-4 group/title">
          {isEditingTitle ? (
            <div className="flex-1 flex gap-3">
              <input
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') handleCancelTitle();
                }}
                className={clsx(
                  'w-full bg-white dark:bg-slate-950 border-b-4 border-primary rounded-none px-0 py-2 font-black font-[\'Outfit\'] tracking-tighter outline-none',
                  mode === 'page' ? 'text-4xl md:text-6xl' : 'text-2xl md:text-4xl'
                )}
                autoFocus
              />
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleSaveTitle}
                  disabled={isUpdating}
                  className="btn btn-primary btn-square rounded-2xl shadow-xl"
                  title="Save title"
                >
                  {isUpdating ? <span className="loading loading-spinner loading-xs"></span> : <Check size={20} />}
                </button>
                <button
                  type="button"
                  onClick={handleCancelTitle}
                  className="btn btn-ghost btn-square rounded-2xl"
                  title="Cancel"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1">
              <h1
                className={clsx(
                  'font-black font-[\'Outfit\'] leading-tight tracking-tighter text-base-content transform -translate-x-1 mb-1 flex items-center gap-4 flex-wrap',
                  mode === 'page' ? 'text-4xl md:text-6xl' : 'text-2xl md:text-4xl'
                )}
              >
                {title}
                {isAuthorized && (
                  <button
                    type="button"
                    onClick={() => {
                      setTempTitle(title);
                      setIsEditingTitle(true);
                    }}
                    className="opacity-0 group-hover/title:opacity-100 btn btn-ghost btn-sm btn-square hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
                    title="Edit Title"
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
  );
};

export default TaskHeader;
