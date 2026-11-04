import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { taskApi, userApi, teamApi } from '../api/axios';
import { useAuth } from '../context/useAuth';
import type { Task, Comment, Team, User, TaskStatus } from '../types';
import {
  TaskHeader,
  TaskDocumentation,
  TaskCommentsSection,
  TaskContextSidebar,
} from './task';

interface TaskDetailsModalProps {
  taskId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  taskId,
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const qc = useQueryClient();

  // Queries
  const {
    data: task,
    isLoading: taskLoading,
    error: taskError,
  } = useQuery<Task>({
    queryKey: ['task', taskId],
    queryFn: async () => (await taskApi.get<Task>(`/${taskId}`)).data,
    enabled: isOpen && !!taskId,
    retry: false,
  });

  const { data: comments, isLoading: commentsLoading } = useQuery<Comment[]>({
    queryKey: ['comments', taskId],
    queryFn: async () => (await taskApi.get<Comment[]>(`/${taskId}/comments`)).data,
    enabled: isOpen && !!taskId && !taskError,
  });

  const { data: team } = useQuery<Team>({
    queryKey: ['team', task?.teamId],
    queryFn: async () => (await teamApi.get<Team>(`/${task?.teamId}`)).data,
    enabled: isOpen && !!task?.teamId,
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => (await userApi.get<User[]>('')).data,
    enabled: isOpen,
  });

  const isAuthorizedToEdit =
    Boolean(user && task && (user.id === task.creatorId || user.id === team?.leaderId || user.role === 'ADMIN'));

  const assignees: User[] =
    users?.filter((u) => task?.assigneeIds?.includes(u.id)) || [];
  const creatorName =
    users?.find((u) => u.id === task?.creatorId)?.fullName || 'Unknown';

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: async (status: TaskStatus) =>
      taskApi.patch(`/${taskId}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['task', taskId] });
      toast.success('Status updated');
    },
    onError: () => toast.error('Failed to update status'),
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (payload: Partial<Task>) =>
      taskApi.patch(`/${taskId}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['task', taskId] });
      toast.success('Task updated');
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      toast.error(msg || 'Failed to update task');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => taskApi.delete(`/${taskId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task deleted');
      onClose();
    },
    onError: () => toast.error('Failed to delete task'),
  });

  const commentMutation = useMutation({
    mutationFn: async ({ text, files }: { text: string; files: File[] }) => {
      const formData = new FormData();
      formData.append('text', text);
      formData.append('creatorName', user?.fullName || 'User');

      files.forEach((file) => {
        formData.append('files', file);
      });

      return taskApi.post(`/${taskId}/comments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', taskId] });
      qc.invalidateQueries({ queryKey: ['task', taskId] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
      if (task?.status === 'DONE') {
        toast.success('Task reopened: In Progress', { icon: '🔄' });
      } else {
        toast.success('Comment added');
      }
    },
    onError: () => toast.error('Failed to post comment'),
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {taskLoading ? (
          <div className="flex h-full items-center justify-center">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        ) : taskError || !task ? (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <div className="bg-rose-50 dark:bg-rose-500/5 text-rose-600 dark:text-rose-400 p-8 rounded-[2rem] font-bold border border-rose-100 dark:border-rose-500/20 max-w-md">
              Access Denied or Task Not Found
            </div>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-primary mt-6"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <TaskHeader
              taskId={task._id}
              title={task.title}
              status={task.status}
              priority={task.priority}
              isAuthorized={isAuthorizedToEdit}
              onUpdateTitle={(title) => updateTaskMutation.mutate({ title })}
              onUpdatePriority={(priority) =>
                updateTaskMutation.mutate({ priority })
              }
              onDelete={() => {
                if (window.confirm('Delete this task?')) {
                  deleteMutation.mutate();
                }
              }}
              onBackOrClose={onClose}
              mode="modal"
              isUpdating={updateTaskMutation.isPending}
            />

            <div className="flex-1 overflow-y-auto flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
              <div className="flex-1 p-8 space-y-10 overflow-y-auto no-scrollbar">
                <TaskDocumentation
                  description={task.description}
                  attachments={task.attachments}
                  isAuthorized={isAuthorizedToEdit}
                  onSaveDescription={(description) =>
                    updateTaskMutation.mutate({ description })
                  }
                  isSaving={updateTaskMutation.isPending}
                />

                <TaskCommentsSection
                  comments={comments}
                  isLoading={commentsLoading}
                  onAddComment={(text, files) =>
                    commentMutation.mutate({ text, files })
                  }
                  isPosting={commentMutation.isPending}
                  taskStatus={task.status}
                  taskUpdatedAt={task.updatedAt}
                />
              </div>

              <TaskContextSidebar
                status={task.status}
                assignees={assignees}
                creatorName={creatorName}
                deadline={task.deadline}
                createdAt={task.createdAt}
                updatedAt={task.updatedAt}
                onUpdateStatus={(status) => updateStatusMutation.mutate(status)}
                isUpdatingStatus={updateStatusMutation.isPending}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TaskDetailsModal;
