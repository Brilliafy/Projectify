import React, { useState } from 'react';
import { Calendar, Clock, Edit2, X, Check, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import type { TaskStatus, User } from '../../types';
import { getStatusInfo } from './taskHelpers';

interface TaskContextSidebarProps {
  status: TaskStatus;
  assignees: User[];
  creatorName: string;
  deadline?: string | null;
  createdAt: string;
  updatedAt: string;
  onUpdateStatus: (status: TaskStatus) => void;
  isUpdatingStatus?: boolean;
}

const STATUS_OPTIONS: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE'];

export const TaskContextSidebar: React.FC<TaskContextSidebarProps> = ({
  status,
  assignees,
  creatorName,
  deadline,
  createdAt,
  updatedAt,
  onUpdateStatus,
  isUpdatingStatus = false,
}) => {
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const statusInfo = getStatusInfo(status);
  const StatusIcon = statusInfo.icon;

  const isDone = status === 'DONE';
  const deadlineDate = deadline ? new Date(deadline) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isOverdue = !isDone && !!deadlineDate && deadlineDate < today;

  return (
    <div className="w-full md:w-96 bg-slate-50/50 dark:bg-slate-900/50 border-l border-base-200 dark:border-slate-800 p-6 md:p-8 space-y-8 h-auto md:h-full overflow-y-auto">
      <div>
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-3 font-['Inter']">Context</h4>

        <div className="space-y-4">
          {/* Status Dropdown */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-base-200 dark:border-slate-800 shadow-sm relative">
            <label className="text-[9px] uppercase font-bold tracking-wider opacity-40 mb-2 block">Current Status</label>
            <button
              type="button"
              onClick={() => setIsStatusOpen(!isStatusOpen)}
              disabled={isUpdatingStatus}
              className="w-full flex items-center justify-between gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-all"
            >
              <div className="flex items-center gap-3">
                <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', statusInfo.bg)}>
                  <StatusIcon size={16} className={statusInfo.color} />
                </div>
                <span className="text-sm font-bold">{statusInfo.label}</span>
              </div>
              <X size={14} className={clsx('opacity-20 transition-transform', isStatusOpen ? 'rotate-0' : 'rotate-45')} />
            </button>

            {isStatusOpen && (
              <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-4">
                {STATUS_OPTIONS.map((s) => {
                  const info = getStatusInfo(s);
                  const Icon = info.icon;
                  const isCurrent = status === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        onUpdateStatus(s);
                        setIsStatusOpen(false);
                      }}
                      className={clsx(
                        'w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left',
                        isCurrent ? 'bg-primary/5 text-primary' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                      )}
                    >
                      <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', info.bg)}>
                        <Icon size={16} className={info.color} />
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest">{info.label}</span>
                      {isCurrent && <Check size={14} className="ml-auto" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Team Members */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-base-200 dark:border-slate-800 shadow-sm">
            <label className="text-[9px] uppercase font-bold tracking-wider opacity-40 mb-2 block">Team Members</label>
            <div className="space-y-3">
              {assignees.length > 0 ? (
                assignees.map((u) => (
                  <div key={u.id} className="flex items-center gap-3">
                    <div className="avatar placeholder">
                      <div className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center">
                        {u.fullName[0]?.toUpperCase() || 'U'}
                      </div>
                    </div>
                    <span className="text-sm font-bold truncate">{u.fullName}</span>
                  </div>
                ))
              ) : (
                <span className="italic opacity-40 text-sm">No active assignees</span>
              )}
            </div>
          </div>

          {/* Creator & Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-base-200 dark:border-slate-800 shadow-sm">
              <label className="text-[9px] uppercase font-bold tracking-wider opacity-40 mb-1 block">Creator</label>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                  {creatorName[0]?.toUpperCase() || 'U'}
                </div>
                <span className="text-xs font-bold truncate">{creatorName}</span>
              </div>
            </div>
            <div className={clsx(
              "p-3 rounded-2xl border shadow-sm transition-all",
              isOverdue
                ? "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
                : "bg-white dark:bg-slate-900 border-base-200 dark:border-slate-800"
            )}>
              <div className="flex items-center justify-between mb-1">
                <label className={clsx(
                  "text-[9px] uppercase font-bold tracking-wider block",
                  isOverdue ? "text-rose-600 dark:text-rose-400 font-black opacity-100" : "opacity-40"
                )}>
                  Due Date
                </label>
                {isOverdue && (
                  <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-rose-500 text-white leading-none">
                    Overdue
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 truncate text-xs font-bold">
                {isOverdue ? (
                  <AlertCircle size={13} className="text-rose-500 shrink-0" />
                ) : (
                  <Calendar size={12} className="opacity-50 shrink-0" />
                )}
                <span className={isOverdue ? "font-extrabold text-rose-600 dark:text-rose-400" : ""}>
                  {deadline ? new Date(deadline).toLocaleDateString() : 'None'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timestamps */}
      <div className="pt-6 border-t border-base-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
          <div className="w-8 h-8 bg-white dark:bg-slate-900 rounded-lg flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-800">
            <Clock size={14} className="text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-widest opacity-50">Created on</span>
            <span className="text-xs font-mono font-bold">{new Date(createdAt).toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
          <div className="w-8 h-8 bg-white dark:bg-slate-900 rounded-lg flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-800">
            <Edit2 size={14} className="text-amber-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-widest opacity-50">Last Update</span>
            <span className="text-xs font-mono font-bold">{new Date(updatedAt).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskContextSidebar;
