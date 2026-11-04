import { useParams, useNavigate } from 'react-router-dom';
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
} from '../components/task';

export default function TaskDetail() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
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
    enabled: !!taskId,
    retry: false,
  });

  const { data: comments, isLoading: commentsLoading } = useQuery<Comment[]>({
    queryKey: ['comments', taskId],
    queryFn: async () => (await taskApi.get<Comment[]>(`/${taskId}/comments`)).data,
    enabled: !!taskId && !taskError,
  });

  const { data: team } = useQuery<Team>({
    queryKey: ['team', task?.teamId],
    queryFn: async () => (await teamApi.get<Team>(`/${task?.teamId}`)).data,
    enabled: !!task?.teamId,
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => (await userApi.get<User[]>('')).data,
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
      navigate('/dashboard');
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
      toast.success('Comment added');
    },
    onError: () => toast.error('Failed to post comment'),
  });

  if (taskLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (taskError || !task) {
    return (
      <div className="flex bg-slate-50 dark:bg-slate-950 h-screen items-center justify-center p-4">
        <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full border border-base-200">
          <h2 className="text-2xl font-black font-['Outfit'] mb-2">Access Denied</h2>
          <p className="opacity-60 mb-6 font-['Inter']">
            This task doesn&apos;t exist or you don&apos;t have permission to view it.
          </p>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="btn btn-primary w-full"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 font-['Inter']">
      <div className="max-w-7xl mx-auto bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-base-200 dark:border-slate-800 overflow-hidden flex flex-col md:flex-row min-h-[85vh] animate-in fade-in duration-300">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <TaskHeader
            taskId={task._id}
            title={task.title}
            status={task.status}
            priority={task.priority}
            isAuthorized={isAuthorizedToEdit}
            onUpdateTitle={(title) => updateTaskMutation.mutate({ title })}
            onUpdatePriority={(priority) => updateTaskMutation.mutate({ priority })}
            onDelete={() => {
              if (window.confirm('Delete this task irrevocably?')) {
                deleteMutation.mutate();
              }
            }}
            onBackOrClose={() => navigate(-1)}
            mode="page"
            isUpdating={updateTaskMutation.isPending}
          />

          <div className="p-6 md:p-8 space-y-8 flex-1 overflow-y-auto">
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
              onAddComment={(text, files) => commentMutation.mutate({ text, files })}
              isPosting={commentMutation.isPending}
            />
          </div>
        </div>

        {/* Sidebar */}
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
    </div>
  );
}