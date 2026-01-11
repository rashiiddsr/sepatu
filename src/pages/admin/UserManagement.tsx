import { useState, useEffect } from 'react';
import type { Profile } from '../../types/database';
import { Users, Shield, ShieldCheck } from 'lucide-react';
import { api } from '../../lib/api';

export default function UserManagement() {
  const [users, setUsers] = useState<Profile[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const data = await api.getAdminUsers();
    setUsers(data);
  };

  const updateUserRole = async (userId: string, role: Profile['role']) => {
    try {
      await api.updateAdminUserRole(userId, role);
      fetchUsers();
    } catch (error) {
      alert('Failed to update user role');
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900 mb-8">User Management</h1>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">User</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Role</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{user.full_name}</p>
                        <p className="text-sm text-slate-600">{user.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.role === 'super_admin'
                        ? 'bg-purple-100 text-purple-800'
                        : user.role === 'admin'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}>
                      {user.role.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => updateUserRole(user.id, 'customer')}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                        title="Make Customer"
                      >
                        <Users className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => updateUserRole(user.id, 'admin')}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Make Admin"
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => updateUserRole(user.id, 'super_admin')}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                        title="Make Super Admin"
                      >
                        <ShieldCheck className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
