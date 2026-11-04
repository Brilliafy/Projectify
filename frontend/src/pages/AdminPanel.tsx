import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../api/axios';
import toast from 'react-hot-toast';
import axios from 'axios';
import {
  Users,
  UserCheck,
  Clock,
  Shield,
  Search,
  Check,
  Trash2,
  Bell,
  Mail,
  AlertCircle,
  Filter,
} from 'lucide-react';
import clsx from 'clsx';
import { useNotification } from '../context/useNotification';
import type { User, UserRole, Notification } from '../types';

export default function AdminPanel() {
  const qc = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'PENDING' | 'ACTIVE' | 'ADMIN'>('ALL');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const { notifications, unreadCount, markAllAsRead, deleteNotifications } = useNotification();

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['admin-users'],
    queryFn: async () => (await userApi.get('/admin')).data,
  });

  const activateUser = useMutation({
    mutationFn: (id: number) => userApi.patch(`/admin/${id}/activate`),
    onSuccess: () => {
      toast.success('Account approved successfully!');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const changeRole = useMutation({
    mutationFn: ({ id, role }: { id: number; role: UserRole }) =>
      userApi.patch(`/admin/${id}/role`, { role }),
    onSuccess: () => {
      toast.success('Role updated');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const deleteUser = useMutation({
    mutationFn: (id: number) => userApi.delete(`/admin/${id}`),
    onSuccess: () => {
      toast.success('User removed');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (e: unknown) => {
      if (axios.isAxiosError(e) && e.response?.data?.error) {
        toast.error(e.response.data.error);
      } else {
        toast.error('Delete failed');
      }
    },
  });

  // Derived statistics
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.isActive);
  const pendingUsers = users.filter((u) => !u.isActive);
  const adminUsers = users.filter((u) => u.role === 'ADMIN');

  // Filtered user list
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (roleFilter === 'PENDING') return !u.isActive;
    if (roleFilter === 'ACTIVE') return u.isActive;
    if (roleFilter === 'ADMIN') return u.role === 'ADMIN';
    return true;
  });

  const handleNotificationClick = (notif: Notification) => {
    setIsNotificationsOpen(false);
    if (notif.message.toLowerCase().includes('pending')) {
      setRoleFilter('PENDING');
    }
  };

  const getAvatarGradient = (id: number) => {
    const gradients = [
      'from-indigo-500 to-purple-600',
      'from-sky-500 to-blue-600',
      'from-amber-500 to-orange-600',
      'from-emerald-500 to-teal-600',
      'from-rose-500 to-pink-600',
    ];
    return gradients[id % gradients.length];
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 font-['Inter']">
        <div className="flex flex-col items-center gap-3">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="text-sm text-slate-500 font-medium">Loading User Directory…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto font-['Inter'] space-y-8 animate-in fade-in duration-300">
      {/* Header section with title and notification bell */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-sm bg-primary/10 text-primary border-none font-bold uppercase tracking-wider text-[10px]">
              Workspace Control
            </span>
            <span className="text-xs text-slate-400 font-medium">• Enterprise Directory</span>
          </div>
          <h1 className="text-4xl font-black font-['Outfit'] tracking-tight text-slate-900 dark:text-white">
            User Administration<span className="text-primary">.</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage user directory access, role permissions, and pending account approvals.
          </p>
        </div>

        {/* Header Action: Admin Notification Center */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="btn btn-outline btn-sm rounded-xl gap-2 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 relative"
          >
            <Bell size={16} className={clsx(unreadCount > 0 ? "text-primary animate-bounce" : "text-slate-500")} />
            <span className="text-xs font-bold">Admin Notifications</span>
            {unreadCount > 0 && (
              <span className="badge badge-xs bg-rose-500 text-white font-bold px-1.5 py-0.5">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <>
              <div className="fixed inset-0 z-[90]" onClick={() => setIsNotificationsOpen(false)} />
              <div className="absolute right-0 top-full mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 shadow-2xl rounded-2xl border border-slate-200 dark:border-slate-800 z-[100] animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
                  <h4 className="font-bold text-xs uppercase tracking-widest text-slate-600 dark:text-slate-400">
                    Notifications
                  </h4>
                  <div className="flex gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="btn btn-xs btn-ghost gap-1 text-[10px] font-bold text-primary"
                      >
                        <Check size={12} /> Mark read
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        onClick={deleteNotifications}
                        className="btn btn-xs btn-ghost btn-square w-7 h-7 text-rose-500 hover:bg-rose-500/10"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">No notifications yet</div>
                ) : (
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {notifications.map((n) => (
                      <div
                        key={n._id}
                        onClick={() => handleNotificationClick(n)}
                        className={clsx(
                          "p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer flex gap-3",
                          !n.read && "bg-indigo-50/40 dark:bg-indigo-950/20"
                        )}
                      >
                        <div
                          className={clsx(
                            "mt-1 w-2 h-2 rounded-full shrink-0",
                            !n.read ? "bg-primary animate-pulse" : "bg-slate-300 dark:bg-slate-700"
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className={clsx(
                              "text-xs leading-relaxed",
                              !n.read ? "font-bold text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"
                            )}
                          >
                            {n.message}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-primary flex items-center justify-center shrink-0">
            <Users size={22} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Total Accounts
            </span>
            <span className="text-2xl font-black font-['Outfit'] text-slate-900 dark:text-white">
              {totalUsers}
            </span>
          </div>
        </div>

        {/* Active Members */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center shrink-0">
            <UserCheck size={22} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Active Directory
            </span>
            <span className="text-2xl font-black font-['Outfit'] text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              {activeUsers.length}
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </span>
          </div>
        </div>

        {/* Pending Approvals */}
        <div
          onClick={() => setRoleFilter('PENDING')}
          className={clsx(
            "p-5 rounded-2xl border shadow-xs flex items-center gap-4 cursor-pointer transition-all hover:scale-[1.02]",
            pendingUsers.length > 0
              ? "bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/80"
              : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800"
          )}
        >
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock size={22} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Pending Approvals
            </span>
            <span className="text-2xl font-black font-['Outfit'] text-amber-600 dark:text-amber-400">
              {pendingUsers.length}
            </span>
          </div>
        </div>

        {/* Admins */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center shrink-0">
            <Shield size={22} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Administrators
            </span>
            <span className="text-2xl font-black font-['Outfit'] text-purple-600 dark:text-purple-400">
              {adminUsers.length}
            </span>
          </div>
        </div>
      </div>

      {/* Pending Banner Alert if any account requires review */}
      {pendingUsers.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-200/70 text-amber-800 flex items-center justify-center shrink-0">
              <AlertCircle size={20} />
            </div>
            <div>
              <p className="text-sm font-bold">
                {pendingUsers.length} account request{pendingUsers.length > 1 ? 's' : ''} awaiting review
              </p>
              <p className="text-xs text-amber-700/80">
                Grant permissions to unlock access to workspace projects and teams.
              </p>
            </div>
          </div>
          <button
            onClick={() => setRoleFilter('PENDING')}
            className="btn btn-xs bg-amber-600 hover:bg-amber-700 text-white font-bold border-none rounded-lg px-3 py-1.5"
          >
            Review Pending Users
          </button>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-primary transition-colors shadow-xs"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setRoleFilter('ALL')}
            className={clsx(
              "px-3 py-1.5 rounded-lg transition-all",
              roleFilter === 'ALL'
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold"
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            All ({totalUsers})
          </button>
          <button
            onClick={() => setRoleFilter('PENDING')}
            className={clsx(
              "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5",
              roleFilter === 'PENDING'
                ? "bg-amber-500 text-white shadow-xs font-bold"
                : "text-slate-500 hover:text-amber-600"
            )}
          >
            Pending
            {pendingUsers.length > 0 && (
              <span className="badge badge-xs bg-amber-200 text-amber-900 border-none font-black px-1.5">
                {pendingUsers.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setRoleFilter('ACTIVE')}
            className={clsx(
              "px-3 py-1.5 rounded-lg transition-all",
              roleFilter === 'ACTIVE'
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold"
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            Active ({activeUsers.length})
          </button>
          <button
            onClick={() => setRoleFilter('ADMIN')}
            className={clsx(
              "px-3 py-1.5 rounded-lg transition-all",
              roleFilter === 'ADMIN'
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold"
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            Admins ({adminUsers.length})
          </button>
        </div>
      </div>

      {/* Redesigned Modern User Directory Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-black uppercase tracking-wider text-slate-400">
                <th className="py-4 px-6">User Member</th>
                <th className="py-4 px-6">Access Status</th>
                <th className="py-4 px-6">Role & Permissions</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-sm">
              {filteredUsers.map((u) => {
                const initials = u.fullName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase();

                return (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* User Info Column */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3.5">
                        <div
                          className={clsx(
                            "w-10 h-10 rounded-xl bg-gradient-to-br text-white font-black flex items-center justify-center text-xs shadow-xs shrink-0",
                            getAvatarGradient(u.id)
                          )}
                        >
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white text-sm truncate">
                              {u.fullName}
                            </span>
                            {!u.isActive && (
                              <span className="badge badge-xs bg-amber-100 text-amber-800 font-bold border-none px-1.5 py-0.5">
                                New Request
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                            <Mail size={12} className="text-slate-400 shrink-0" />
                            {u.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Status Column */}
                    <td className="py-4 px-6">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          Pending Approval
                        </span>
                      )}
                    </td>

                    {/* Role Selector Column */}
                    <td className="py-4 px-6">
                      <div className="inline-flex items-center">
                        <select
                          aria-label={`Role for ${u.fullName}`}
                          className="select select-sm select-bordered rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 focus:border-primary focus:outline-none"
                          value={u.role}
                          onChange={(e) =>
                            changeRole.mutate({ id: u.id, role: e.target.value as UserRole })
                          }
                        >
                          <option value="MEMBER">💻 Member (Developer)</option>
                          <option value="TEAM_LEADER">🚀 Team Leader</option>
                          <option value="ADMIN">👑 System Admin</option>
                        </select>
                      </div>
                    </td>

                    {/* Actions Column */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!u.isActive && (
                          <button
                            type="button"
                            className="btn btn-sm bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold gap-1.5 rounded-xl border-none shadow-xs transition-transform active:scale-95 cursor-pointer"
                            onClick={() => activateUser.mutate(u.id)}
                            title="Approve user registration"
                          >
                            <Check size={14} />
                            Approve
                          </button>
                        )}

                        <button
                          type="button"
                          className="btn btn-sm btn-ghost text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors p-2"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to remove ${u.fullName} from Projectify?`)) {
                              deleteUser.mutate(u.id);
                            }
                          }}
                          title="Delete user account"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                      <Filter size={32} className="opacity-40" />
                      <p className="text-sm font-semibold">No users found</p>
                      <p className="text-xs opacity-75">
                        Try adjusting your search query or role filter.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
