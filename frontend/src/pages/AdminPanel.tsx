import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../api/axios';
import toast from 'react-hot-toast';

type User = {
  id: number;
  email: string;
  fullName: string;
  role: 'MEMBER' | 'TEAM_LEADER' | 'ADMIN';
  isActive: boolean;
};

export default function AdminPanel() {
  const qc = useQueryClient();

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['admin-users'],
    queryFn: async () => (await userApi.get('/admin')).data,
  });

  const activateUser = useMutation({
    mutationFn: (id: number) => userApi.patch(`/admin/${id}/activate`),
    onSuccess: () => {
      toast.success('User approved');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const changeRole = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) =>
      userApi.patch(`/admin/${id}/role`, { role }),
    onSuccess: () => {
      toast.success('Role updated');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const deleteUser = useMutation({
    mutationFn: (id: number) => userApi.delete(`/admin/${id}`),
    onSuccess: () => {
      toast.success('User deleted');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.error || 'Delete failed');
    },
  });

  if (isLoading) return <div className="p-10">Loading users…</div>;

  return (
    <div className="p-10 max-w-7xl mx-auto">
      <h1 className="text-3xl font-semibold mb-8">User Administration</h1>

      <div className="overflow-hidden rounded-xl border border-base-300 bg-slate-100 dark:bg-slate-900 p-4">
        <table className="table w-full">
          <thead className="bg-base-200">
            <tr>
              <th>User</th>
              <th>Status</th>
              <th>Role</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {users?.map((u) => (
              <tr key={u.id} className="hover p-4">
                <td className="p-4">
                  <div className="font-medium">{u.fullName}</div>
                  <div className="text-sm opacity-60">{u.email}</div>
                </td>

                <td className="p-4">
                  {u.isActive ? (
                    <span className="badge badge-success">Active</span>
                  ) : (
                    <span className="badge badge-warning">Pending</span>
                  )}
                </td>

                <td className="p-4">
                  <select
                    className="select select-sm select-bordered p-1"
                    value={u.role}
                    onChange={(e) =>
                      changeRole.mutate({ id: u.id, role: e.target.value })
                    }
                  >
                    <option value="MEMBER">Member</option>
                    <option value="TEAM_LEADER">Team Leader</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </td>

                <td className="text-right space-x-2 p-4">
                  {!u.isActive && (
                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => activateUser.mutate(u.id)}
                    >
                      Approve
                    </button>
                  )}

                  <button
                    className="btn btn-sm btn-outline btn-error"
                    onClick={() => {
                      if (
                        confirm(
                          `Delete ${u.fullName}? This cannot be undone.`
                        )
                      ) {
                        deleteUser.mutate(u.id);
                      }
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
