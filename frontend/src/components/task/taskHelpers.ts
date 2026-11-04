import { CheckCircle2, Clock, CircleDot, type LucideIcon } from 'lucide-react';
import type { TaskPriority, TaskStatus } from '../../types';

export interface PriorityInfo {
  color: string;
  bg: string;
  label: string;
}

export interface StatusInfo {
  icon: LucideIcon;
  color: string;
  bg: string;
  label: string;
}

export const getPriorityInfo = (p: TaskPriority): PriorityInfo => {
  switch (p) {
    case 'HIGH':
      return { color: 'text-rose-500', bg: 'bg-rose-500/10', label: 'High Priority' };
    case 'MEDIUM':
      return { color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Medium Priority' };
    default:
      return { color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Low Priority' };
  }
};

export const getStatusInfo = (status: TaskStatus): StatusInfo => {
  switch (status) {
    case 'DONE':
      return { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Completed' };
    case 'IN_PROGRESS':
      return { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'In Progress' };
    default:
      return { icon: CircleDot, color: 'text-slate-400', bg: 'bg-slate-500/10', label: 'To Do' };
  }
};
