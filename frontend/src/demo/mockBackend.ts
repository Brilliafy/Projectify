import type { InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import {
  INITIAL_USERS,
  INITIAL_TEAMS,
  INITIAL_TASKS,
  INITIAL_COMMENTS,
  INITIAL_NOTIFICATIONS,
  createNotificationsForUser,
} from './mockData';
import type { User, Team, Task, Notification, Comment } from '../types';

export const demoNotificationBus = new EventTarget();

const STORAGE_KEYS = {
  USERS: 'projectify_demo_users',
  TEAMS: 'projectify_demo_teams',
  TASKS: 'projectify_demo_tasks',
  COMMENTS: 'projectify_demo_comments',
  NOTIFICATIONS: 'projectify_demo_notifications',
};

function getStorage<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setStorage<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.warn('LocalStorage save failed:', err);
  }
}

const DEMO_SCHEMA_VERSION = 'v6_preserve_completed_timeline_events';

export function initDemoStorage(): void {
  const currentVersion = localStorage.getItem('projectify_demo_version');
  if (currentVersion !== DEMO_SCHEMA_VERSION) {
    resetDemoData();
    localStorage.setItem('projectify_demo_version', DEMO_SCHEMA_VERSION);
    return;
  }

  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    setStorage(STORAGE_KEYS.USERS, INITIAL_USERS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.TEAMS)) {
    setStorage(STORAGE_KEYS.TEAMS, INITIAL_TEAMS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.TASKS)) {
    setStorage(STORAGE_KEYS.TASKS, INITIAL_TASKS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.COMMENTS)) {
    setStorage(STORAGE_KEYS.COMMENTS, INITIAL_COMMENTS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
    setStorage(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  }
}

export function resetDemoData(): void {
  setStorage(STORAGE_KEYS.USERS, INITIAL_USERS);
  setStorage(STORAGE_KEYS.TEAMS, INITIAL_TEAMS);
  setStorage(STORAGE_KEYS.TASKS, INITIAL_TASKS);
  setStorage(STORAGE_KEYS.COMMENTS, INITIAL_COMMENTS);
  setStorage(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
}

function getCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function createSuccessResponse<T>(data: T, config: InternalAxiosRequestConfig): AxiosResponse<T> {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  };
}

function createError(message: string, status = 400) {
  const err = new Error(message) as Error & { response: { status: number; data: { error: string } } };
  err.response = {
    status,
    data: { error: message },
  };
  return err;
}

function parsePayload<T = Record<string, unknown>>(data: unknown): T {
  if (!data) return {} as T;
  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as T;
    } catch {
      return {} as T;
    }
  }
  return data as T;
}

export async function handleMockRequest(config: InternalAxiosRequestConfig): Promise<AxiosResponse> {
  initDemoStorage();

  const url = config.url || '';
  const method = (config.method || 'get').toLowerCase();
  const baseURL = config.baseURL || '';
  const fullPath = `${baseURL}${url}`.replace(/\/+/g, '/');

  // Slight network latency emulation (30ms) for realistic UX
  await new Promise((r) => setTimeout(r, 30));

  const currentUser = getCurrentUser();

  // -------------------------------------------------------------
  // USER SERVICE ROUTES
  // -------------------------------------------------------------
  if (fullPath.startsWith('/api/users')) {
    const sub = fullPath.replace('/api/users', '');
    const users = getStorage<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);

    // POST /login
    if (method === 'post' && sub === '/login') {
      const { email } = parsePayload<{ email?: string; password?: string }>(config.data);
      const matched = users.find((u) => u.email.toLowerCase() === (email || '').toLowerCase());
      if (!matched) {
        throw createError('Invalid email or password', 401);
      }
      if (!matched.isActive) {
        throw createError('Your account is awaiting admin approval', 403);
      }
      return createSuccessResponse(
        {
          token: `demo-token-${matched.id}-${Date.now()}`,
          user: matched,
        },
        config
      );
    }

    // POST /register
    if (method === 'post' && sub === '/register') {
      const { email, fullName } = parsePayload<{ email: string; fullName: string }>(config.data);
      if (!email || !fullName) throw createError('Email and full name required', 400);

      const exists = users.some((u) => u.email.toLowerCase() === email.toLowerCase());
      if (exists) throw createError('Email already exists', 400);

      const newUser: User = {
        id: users.length ? Math.max(...users.map((u) => u.id)) + 1 : 1,
        email,
        fullName,
        role: 'MEMBER',
        isActive: false,
        createdAt: new Date().toISOString(),
      };
      setStorage(STORAGE_KEYS.USERS, [...users, newUser]);

      // Automatically notify administrators of new registration awaiting approval
      const adminUsers = users.filter((u) => u.role === 'ADMIN');
      const notifications = getStorage<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
      const newNotifs: Notification[] = adminUsers.map((admin) => ({
        _id: `notif-pending-${newUser.id}-${Date.now()}`,
        userId: admin.id,
        type: 'TASK_UPDATED',
        message: `New account pending approval: "${fullName}" (${email})`,
        relatedId: String(newUser.id),
        read: false,
        createdAt: new Date().toISOString(),
      }));
      setStorage(STORAGE_KEYS.NOTIFICATIONS, [...newNotifs, ...notifications]);
      newNotifs.forEach((n) => demoNotificationBus.dispatchEvent(new CustomEvent('notification', { detail: n })));

      return createSuccessResponse(
        { message: 'Account created. Awaiting admin approval.', id: newUser.id },
        config
      );
    }

    // GET /admin
    if (method === 'get' && sub === '/admin') {
      return createSuccessResponse(users, config);
    }

    // PATCH /admin/:id/activate
    const activateMatch = sub.match(/^\/admin\/(\d+)\/activate$/);
    if (method === 'patch' && activateMatch) {
      const targetId = Number(activateMatch[1]);
      const updated = users.map((u) => (u.id === targetId ? { ...u, isActive: true } : u));
      setStorage(STORAGE_KEYS.USERS, updated);
      const target = updated.find((u) => u.id === targetId);
      return createSuccessResponse(target, config);
    }

    // PATCH /admin/:id/role
    const roleMatch = sub.match(/^\/admin\/(\d+)\/role$/);
    if (method === 'patch' && roleMatch) {
      const targetId = Number(roleMatch[1]);
      const { role } = parsePayload<{ role: User['role'] }>(config.data);
      const updated = users.map((u) => (u.id === targetId ? { ...u, role } : u));
      setStorage(STORAGE_KEYS.USERS, updated);
      const target = updated.find((u) => u.id === targetId);
      return createSuccessResponse(target, config);
    }

    // DELETE /admin/:id
    const deleteMatch = sub.match(/^\/admin\/(\d+)$/);
    if (method === 'delete' && deleteMatch) {
      const targetId = Number(deleteMatch[1]);
      const updated = users.filter((u) => u.id !== targetId);
      setStorage(STORAGE_KEYS.USERS, updated);
      return createSuccessResponse({ message: 'User deleted' }, config);
    }

    // GET /api/users (all active users)
    if (method === 'get' && (sub === '' || sub === '/')) {
      return createSuccessResponse(
        users.filter((u) => u.isActive),
        config
      );
    }
  }

  // -------------------------------------------------------------
  // TEAM SERVICE ROUTES
  // -------------------------------------------------------------
  if (fullPath.startsWith('/api/teams')) {
    const sub = fullPath.replace('/api/teams', '');
    const teams = getStorage<Team[]>(STORAGE_KEYS.TEAMS, INITIAL_TEAMS);

    // GET /mine
    if (method === 'get' && sub === '/mine') {
      const currentId = currentUser?.id ?? 1;
      const filtered = teams.filter((t) => t.members.includes(currentId));
      return createSuccessResponse(filtered, config);
    }

    // GET /owned
    if (method === 'get' && sub === '/owned') {
      const currentId = currentUser?.id ?? 1;
      const filtered = teams.filter((t) => t.leaderId === currentId);
      return createSuccessResponse(filtered, config);
    }

    // POST / (create team)
    if (method === 'post' && (sub === '' || sub === '/')) {
      const body = parsePayload<{ name: string; description?: string }>(config.data);
      const newTeam: Team = {
        _id: `team-${Date.now()}`,
        name: body.name || 'New Team',
        description: body.description,
        leaderId: currentUser?.id ?? 1,
        members: [currentUser?.id ?? 1],
        createdAt: new Date().toISOString(),
      };
      setStorage(STORAGE_KEYS.TEAMS, [newTeam, ...teams]);
      return createSuccessResponse(newTeam, config);
    }

    // POST /:id/members
    const addMemberMatch = sub.match(/^\/([^/]+)\/members$/);
    if (method === 'post' && addMemberMatch) {
      const teamId = addMemberMatch[1];
      const { userIdToAdd } = parsePayload<{ userIdToAdd: number }>(config.data);
      const updated = teams.map((t) => {
        if (t._id === teamId && !t.members.includes(userIdToAdd)) {
          return { ...t, members: [...t.members, userIdToAdd] };
        }
        return t;
      });
      setStorage(STORAGE_KEYS.TEAMS, updated);

      // Trigger notification for the added user
      const notif: Notification = {
        _id: `notif-${Date.now()}`,
        userId: userIdToAdd,
        type: 'TEAM_ADDED',
        message: `You were added to team "${teams.find((t) => t._id === teamId)?.name}"`,
        relatedId: teamId,
        read: false,
        createdAt: new Date().toISOString(),
      };
      const notifications = getStorage<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
      setStorage(STORAGE_KEYS.NOTIFICATIONS, [notif, ...notifications]);
      demoNotificationBus.dispatchEvent(new CustomEvent('notification', { detail: notif }));

      return createSuccessResponse(updated.find((t) => t._id === teamId), config);
    }

    // DELETE /:id/members/:userId
    const removeMemberMatch = sub.match(/^\/([^/]+)\/members\/(\d+)$/);
    if (method === 'delete' && removeMemberMatch) {
      const teamId = removeMemberMatch[1];
      const memberId = Number(removeMemberMatch[2]);
      const updated = teams.map((t) => {
        if (t._id === teamId) {
          return { ...t, members: t.members.filter((m) => m !== memberId) };
        }
        return t;
      });
      setStorage(STORAGE_KEYS.TEAMS, updated);
      return createSuccessResponse(updated.find((t) => t._id === teamId), config);
    }

    // PATCH /:id
    const patchTeamMatch = sub.match(/^\/([^/]+)$/);
    if (method === 'patch' && patchTeamMatch && !sub.includes('/members')) {
      const teamId = patchTeamMatch[1];
      const body = parsePayload<Partial<Team>>(config.data);
      const updated = teams.map((t) => (t._id === teamId ? { ...t, ...body } : t));
      setStorage(STORAGE_KEYS.TEAMS, updated);
      return createSuccessResponse(updated.find((t) => t._id === teamId), config);
    }

    // DELETE /:id
    if (method === 'delete' && patchTeamMatch && !sub.includes('/members')) {
      const teamId = patchTeamMatch[1];
      const updated = teams.filter((t) => t._id !== teamId);
      setStorage(STORAGE_KEYS.TEAMS, updated);
      return createSuccessResponse({ message: 'Team deleted' }, config);
    }

    // GET /:id
    if (method === 'get' && patchTeamMatch && !sub.includes('/members') && sub !== '/mine' && sub !== '/owned') {
      const teamId = patchTeamMatch[1];
      const found = teams.find((t) => t._id === teamId);
      if (!found) throw createError('Team not found', 404);
      return createSuccessResponse(found, config);
    }

    // GET / (all teams)
    if (method === 'get' && (sub === '' || sub === '/')) {
      return createSuccessResponse(teams, config);
    }
  }

  // -------------------------------------------------------------
  // TASK SERVICE ROUTES
  // -------------------------------------------------------------
  if (fullPath.startsWith('/api/tasks')) {
    const sub = fullPath.replace('/api/tasks', '');
    const tasks = getStorage<Task[]>(STORAGE_KEYS.TASKS, INITIAL_TASKS);
    const commentsMap = getStorage<Record<string, Comment[]>>(STORAGE_KEYS.COMMENTS, INITIAL_COMMENTS);

    // GET /:id/comments
    const commentsGetMatch = sub.match(/^\/([^/]+)\/comments$/);
    if (method === 'get' && commentsGetMatch) {
      const taskId = commentsGetMatch[1];
      return createSuccessResponse(commentsMap[taskId] || [], config);
    }

    // POST /:id/comments
    if (method === 'post' && commentsGetMatch) {
      const taskId = commentsGetMatch[1];
      let text = '';
      if (config.data instanceof FormData) {
        text = String(config.data.get('text') || '');
      } else {
        const d = parsePayload<{ text?: string }>(config.data);
        text = d.text || '';
      }

      const targetTask = tasks.find((t) => t._id === taskId);
      const isReopening = targetTask && targetTask.status === 'DONE';

      const newComment: Comment = {
        _id: `comm-${Date.now()}`,
        taskId,
        text,
        creatorId: currentUser?.id ?? 1,
        creatorName: currentUser?.fullName ?? 'Demo User',
        creatorRole: currentUser?.role ?? 'MEMBER',
        createdAt: new Date().toISOString(),
      };

      const existingComments = commentsMap[taskId] || [];
      const lastTimelineEvent = [...existingComments].reverse().find(
        (c) => c.eventType === 'COMPLETED' || c.eventType === 'REOPENED'
      );

      const baseComments = [...existingComments];
      // If task was completed (DONE) and timeline didn't have a COMPLETED event,
      // preserve the completed event before adding the new comment and reopened event!
      if (isReopening && (!lastTimelineEvent || lastTimelineEvent.eventType !== 'COMPLETED')) {
        baseComments.push({
          _id: `comm-event-completed-${Date.now() - 2000}`,
          taskId,
          text: 'marked this task as completed',
          creatorId: targetTask?.creatorId ?? 1,
          creatorName: targetTask?.creatorId === 2 ? 'Marcus Vance (Platform Lead)' : 'Elena Rostova (System Admin)',
          creatorRole: targetTask?.creatorId === 2 ? 'TEAM_LEADER' : 'ADMIN',
          eventType: 'COMPLETED',
          createdAt: targetTask?.updatedAt || new Date(Date.now() - 3600000).toISOString(),
        });
      }

      const newCommentsList: Comment[] = [...baseComments, newComment];

      // GITHUB-STYLE REOPEN: If task was completed (DONE), commenting reopens it!
      if (isReopening && targetTask) {
        targetTask.status = 'IN_PROGRESS';
        targetTask.updatedAt = new Date().toISOString();
        const updatedTasks = tasks.map((t) => (t._id === taskId ? targetTask : t));
        setStorage(STORAGE_KEYS.TASKS, updatedTasks);

        const reopenEvent: Comment = {
          _id: `comm-event-${Date.now() + 1}`,
          taskId,
          text: 'reopened this task with a new comment',
          creatorId: currentUser?.id ?? 1,
          creatorName: currentUser?.fullName ?? 'Demo User',
          creatorRole: currentUser?.role ?? 'MEMBER',
          eventType: 'REOPENED',
          createdAt: new Date(Date.now() + 20).toISOString(),
        };
        newCommentsList.push(reopenEvent);

        const reopenNotif: Notification = {
          _id: `notif-${Date.now() + 2}`,
          userId: targetTask.creatorId,
          type: 'TASK_UPDATED',
          message: `Task "${targetTask.title}" was reopened by ${currentUser?.fullName ?? 'a teammate'}`,
          relatedId: taskId,
          read: false,
          createdAt: new Date().toISOString(),
        };
        const notifications = getStorage<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
        setStorage(STORAGE_KEYS.NOTIFICATIONS, [reopenNotif, ...notifications]);
        demoNotificationBus.dispatchEvent(new CustomEvent('notification', { detail: reopenNotif }));
      }

      const updatedComments = {
        ...commentsMap,
        [taskId]: newCommentsList,
      };
      setStorage(STORAGE_KEYS.COMMENTS, updatedComments);

      // Notification to task creator/assignees for comment
      if (targetTask && !isReopening) {
        const notif: Notification = {
          _id: `notif-${Date.now()}`,
          userId: targetTask.creatorId,
          type: 'COMMENT_ADDED',
          message: `${currentUser?.fullName ?? 'A teammate'} commented on "${targetTask.title}"`,
          relatedId: taskId,
          read: false,
          createdAt: new Date().toISOString(),
        };
        const notifications = getStorage<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
        setStorage(STORAGE_KEYS.NOTIFICATIONS, [notif, ...notifications]);
        demoNotificationBus.dispatchEvent(new CustomEvent('notification', { detail: notif }));
      }

      return createSuccessResponse(newComment, config);
    }

    // PATCH /:id/status
    const statusMatch = sub.match(/^\/([^/]+)\/status$/);
    if (method === 'patch' && statusMatch) {
      const taskId = statusMatch[1];
      const { status } = parsePayload<{ status: Task['status'] }>(config.data);
      const previous = tasks.find((t) => t._id === taskId);
      const updated = tasks.map((t) => (t._id === taskId ? { ...t, status, updatedAt: new Date().toISOString() } : t));
      setStorage(STORAGE_KEYS.TASKS, updated);

      // Record timeline events if marking COMPLETED or REOPENED manually
      if (previous && previous.status !== 'DONE' && status === 'DONE') {
        const completedEvent: Comment = {
          _id: `comm-event-${Date.now()}`,
          taskId,
          text: 'marked this task as completed',
          creatorId: currentUser?.id ?? 1,
          creatorName: currentUser?.fullName ?? 'Demo User',
          creatorRole: currentUser?.role ?? 'MEMBER',
          eventType: 'COMPLETED',
          createdAt: new Date().toISOString(),
        };
        const curComments = commentsMap[taskId] || [];
        setStorage(STORAGE_KEYS.COMMENTS, {
          ...commentsMap,
          [taskId]: [...curComments, completedEvent],
        });
      } else if (previous && previous.status === 'DONE' && status !== 'DONE') {
        const curComments = commentsMap[taskId] || [];
        const lastTimelineEvent = [...curComments].reverse().find(
          (c) => c.eventType === 'COMPLETED' || c.eventType === 'REOPENED'
        );
        const toAdd: Comment[] = [];
        if (!lastTimelineEvent || lastTimelineEvent.eventType !== 'COMPLETED') {
          toAdd.push({
            _id: `comm-event-completed-${Date.now() - 1000}`,
            taskId,
            text: 'marked this task as completed',
            creatorId: previous.creatorId ?? 1,
            creatorName: previous.creatorId === 2 ? 'Marcus Vance (Platform Lead)' : 'Elena Rostova (System Admin)',
            creatorRole: previous.creatorId === 2 ? 'TEAM_LEADER' : 'ADMIN',
            eventType: 'COMPLETED',
            createdAt: previous.updatedAt || new Date(Date.now() - 3600000).toISOString(),
          });
        }
        toAdd.push({
          _id: `comm-event-${Date.now()}`,
          taskId,
          text: 'reopened this task',
          creatorId: currentUser?.id ?? 1,
          creatorName: currentUser?.fullName ?? 'Demo User',
          creatorRole: currentUser?.role ?? 'MEMBER',
          eventType: 'REOPENED',
          createdAt: new Date().toISOString(),
        });
        setStorage(STORAGE_KEYS.COMMENTS, {
          ...commentsMap,
          [taskId]: [...curComments, ...toAdd],
        });
      }

      const target = updated.find((t) => t._id === taskId);
      if (target) {
        const notif: Notification = {
          _id: `notif-${Date.now()}`,
          userId: target.creatorId,
          type: 'TASK_UPDATED',
          message: `Task "${target.title}" moved to ${status}`,
          relatedId: taskId,
          read: false,
          createdAt: new Date().toISOString(),
        };
        const notifications = getStorage<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
        setStorage(STORAGE_KEYS.NOTIFICATIONS, [notif, ...notifications]);
        demoNotificationBus.dispatchEvent(new CustomEvent('notification', { detail: notif }));
      }

      return createSuccessResponse(target, config);
    }

    // PATCH /:id
    const taskByIdMatch = sub.match(/^\/([^/]+)$/);
    if (method === 'patch' && taskByIdMatch && !sub.includes('/status') && !sub.includes('/comments')) {
      const taskId = taskByIdMatch[1];
      const body = parsePayload<Partial<Task>>(config.data);
      const updated = tasks.map((t) => (t._id === taskId ? { ...t, ...body, updatedAt: new Date().toISOString() } : t));
      setStorage(STORAGE_KEYS.TASKS, updated);
      return createSuccessResponse(updated.find((t) => t._id === taskId), config);
    }

    // DELETE /:id
    if (method === 'delete' && taskByIdMatch && !sub.includes('/status') && !sub.includes('/comments')) {
      const taskId = taskByIdMatch[1];
      const updated = tasks.filter((t) => t._id !== taskId);
      setStorage(STORAGE_KEYS.TASKS, updated);
      return createSuccessResponse({ message: 'Task deleted' }, config);
    }

    // GET /:id
    if (method === 'get' && taskByIdMatch && !sub.includes('/comments')) {
      const taskId = taskByIdMatch[1];
      const found = tasks.find((t) => t._id === taskId);
      if (!found) throw createError('Task not found', 404);
      return createSuccessResponse(found, config);
    }

    // POST / (create task)
    if (method === 'post' && (sub === '' || sub === '/')) {
      let title = '';
      let description = '';
      let priority: Task['priority'] = 'MEDIUM';
      let deadline: string | undefined = undefined;
      let teamId = '';
      let assigneeIds: number[] = [];

      if (config.data instanceof FormData) {
        title = String(config.data.get('title') || '');
        description = String(config.data.get('description') || '');
        priority = (config.data.get('priority') as Task['priority']) || 'MEDIUM';
        deadline = config.data.get('deadline') ? String(config.data.get('deadline')) : undefined;
        teamId = String(config.data.get('teamId') || '');
        const rawAssignees = config.data.get('assigneeIds');
        if (rawAssignees) {
          try {
            assigneeIds = JSON.parse(String(rawAssignees));
          } catch {
            assigneeIds = [];
          }
        }
      } else {
        const d = parsePayload<Record<string, unknown>>(config.data);
        title = String(d.title || '');
        description = String(d.description || '');
        priority = (d.priority as Task['priority']) || 'MEDIUM';
        deadline = d.deadline ? String(d.deadline) : undefined;
        teamId = String(d.teamId || '');
        assigneeIds = Array.isArray(d.assigneeIds) ? (d.assigneeIds as number[]) : [];
      }

      const newTask: Task = {
        _id: `task-${Date.now()}`,
        title,
        description,
        status: 'TODO',
        priority,
        deadline,
        teamId,
        creatorId: currentUser?.id ?? 1,
        assigneeIds,
        attachments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setStorage(STORAGE_KEYS.TASKS, [newTask, ...tasks]);

      // Notify assignees
      assigneeIds.forEach((uid) => {
        const notif: Notification = {
          _id: `notif-${Date.now()}-${uid}`,
          userId: uid,
          type: 'TASK_ASSIGNED',
          message: `${currentUser?.fullName ?? 'Leader'} assigned you to "${title}"`,
          relatedId: newTask._id,
          read: false,
          createdAt: new Date().toISOString(),
        };
        const notifications = getStorage<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
        setStorage(STORAGE_KEYS.NOTIFICATIONS, [notif, ...notifications]);
        demoNotificationBus.dispatchEvent(new CustomEvent('notification', { detail: notif }));
      });

      return createSuccessResponse(newTask, config);
    }

    // GET / (list tasks, supports params.teamId)
    if (method === 'get' && (sub === '' || sub === '/')) {
      const teamIdFilter = config.params?.teamId;
      if (teamIdFilter) {
        return createSuccessResponse(
          tasks.filter((t) => t.teamId === teamIdFilter),
          config
        );
      }
      return createSuccessResponse(tasks, config);
    }
  }

  // -------------------------------------------------------------
  // NOTIFICATION SERVICE ROUTES
  // -------------------------------------------------------------
  if (fullPath.startsWith('/api/notifications')) {
    const sub = fullPath.replace('/api/notifications', '');
    const notifs = getStorage<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    const currentId = currentUser?.id ?? 1;

    // PATCH /read-all
    if (method === 'patch' && sub === '/read-all') {
      const updated = notifs.map((n) => (n.userId === currentId ? { ...n, read: true } : n));
      setStorage(STORAGE_KEYS.NOTIFICATIONS, updated);
      return createSuccessResponse({ message: 'All marked as read' }, config);
    }

    // PATCH /:id/read
    const notifReadMatch = sub.match(/^\/([^/]+)\/read$/);
    if (method === 'patch' && notifReadMatch) {
      const notifId = notifReadMatch[1];
      const updated = notifs.map((n) => (n._id === notifId ? { ...n, read: true } : n));
      setStorage(STORAGE_KEYS.NOTIFICATIONS, updated);
      return createSuccessResponse(updated.find((n) => n._id === notifId), config);
    }

    // DELETE /
    if (method === 'delete' && (sub === '' || sub === '/')) {
      const updated = notifs.filter((n) => n.userId !== currentId);
      setStorage(STORAGE_KEYS.NOTIFICATIONS, updated);
      return createSuccessResponse({ message: 'Notifications cleared' }, config);
    }

    // GET / (fetch notifications for user)
    if (method === 'get' && (sub === '' || sub === '/')) {
      let userNotifs = notifs.filter((n) => n.userId === currentId);
      if (userNotifs.length === 0) {
        userNotifs = createNotificationsForUser(currentId);
        setStorage(STORAGE_KEYS.NOTIFICATIONS, [...notifs, ...userNotifs]);
      }
      return createSuccessResponse(userNotifs, config);
    }
  }

  // Default fallback
  throw createError(`Not Found: ${method.toUpperCase()} ${fullPath}`, 404);
}
