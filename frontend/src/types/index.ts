export type UserRole = 'ADMIN' | 'TEAM_LEADER' | 'MEMBER';

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt?: string;
}

export interface Team {
  _id: string;
  name: string;
  description?: string;
  leaderId: number;
  members: number[];
  createdAt: string;
  updatedAt?: string;
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Attachment {
  _id?: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  gcsFileName: string;
  url?: string;
  uploadedAt?: string;
}

export interface Comment {
  _id: string;
  taskId: string;
  text: string;
  creatorId: number;
  creatorName: string;
  creatorRole: UserRole | string;
  attachments?: Attachment[];
  createdAt: string;
  updatedAt?: string;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  deadline?: string;
  teamId: string;
  creatorId: number;
  assigneeIds: number[];
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export type NotificationType = 'TASK_ASSIGNED' | 'TASK_UPDATED' | 'COMMENT_ADDED' | 'TEAM_ADDED';

export interface Notification {
  _id: string;
  userId: number;
  type: NotificationType;
  message: string;
  relatedId: string;
  read: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface CreateTaskFormData {
  title: string;
  description: string;
  priority: TaskPriority;
  deadline?: string;
  assigneeIds: number[];
  files?: FileList | File[];
}

export interface CreateTeamFormData {
  name: string;
  description: string;
}
