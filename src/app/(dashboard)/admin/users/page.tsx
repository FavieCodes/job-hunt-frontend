'use client';
import { useEffect, useState, useCallback } from 'react';
import { getUser } from '@/lib/auth';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface AdminUser {
  id: string;
  email: string;
  username: string;
  role: 'user' | 'admin';
  is_confirmed: boolean;
  is_google_user: boolean;
  created_at: string;
  avatar: string | null;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers]         = useState<AdminUser[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Guard: admin only
  useEffect(() => {
    const u = getUser();
    if (!u) { router.push('/login'); return; }
    if (u.role !== 'admin') { router.push('/dashboard'); return; }
  }, [router]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search)     params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      const { data } = await api.get<AdminUser[]>(`/admin/users?${params.toString()}`);
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
    setUpdatingId(userId);
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      toast.success(`Role updated to ${newRole}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to update role');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (userId: string, username: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${username}"? This cannot be undone.`)) return;
    setDeletingId(userId);
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      toast.success(`User "${username}" deleted`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to delete user');
    } finally {
      setDeletingId(null);
    }
  };

  const totalUsers  = users.length;
  const adminCount  = users.filter((u) => u.role === 'admin').length;
  const confirmedCount = users.filter((u) => u.is_confirmed).length;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Page Header */}
      <div className="profile-header">
        <h1><i className="fas fa-users-cog"></i> User Management</h1>
        <p>View, promote, and manage all registered users on the platform</p>
      </div>

      {/* Stats row */}
      <div className="dashboard-stats" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon blue"><i className="fas fa-users"></i></div>
          <div className="stat-info"><h3>{totalUsers}</h3><p>Total Users</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><i className="fas fa-user-shield"></i></div>
          <div className="stat-info"><h3>{adminCount}</h3><p>Admins</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><i className="fas fa-check-circle"></i></div>
          <div className="stat-info"><h3>{confirmedCount}</h3><p>Confirmed</p></div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-card">
        <div className="filters-row">
          <div className="search-input-wrap">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search by username or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="role-select"
          >
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <button onClick={fetchUsers} className="refresh-btn">
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="users-table-card">
        {loading ? (
          <div className="table-loading">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton-row"></div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-users-slash"></i>
            <h3>No users found</h3>
            <p>Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Sign-in</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    {/* Avatar + username */}
                    <td>
                      <div className="user-cell">
                        <img
                          src={
                            u.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(u.username)}&background=06b6d4&color=fff&size=36`
                          }
                          alt={u.username}
                          className="user-thumb"
                        />
                        <span className="user-name">{u.username}</span>
                      </div>
                    </td>

                    <td className="email-cell">{u.email}</td>

                    {/* Role badge + inline toggle */}
                    <td>
                      <span className={`role-badge ${u.role === 'admin' ? 'badge-admin' : 'badge-user'}`}>
                        {u.role === 'admin' ? <i className="fas fa-shield-alt"></i> : <i className="fas fa-user"></i>}
                        {' '}{u.role}
                      </span>
                    </td>

                    {/* Confirmed */}
                    <td>
                      <span className={`status-badge ${u.is_confirmed ? 'badge-confirmed' : 'badge-unconfirmed'}`}>
                        {u.is_confirmed ? <><i className="fas fa-check"></i> Confirmed</> : <><i className="fas fa-clock"></i> Pending</>}
                      </span>
                    </td>

                    {/* Sign-in method */}
                    <td>
                      {u.is_google_user
                        ? <span className="google-tag"><i className="fab fa-google"></i> Google</span>
                        : <span className="email-tag"><i className="fas fa-envelope"></i> Email</span>}
                    </td>

                    {/* Joined date */}
                    <td className="date-cell">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="action-buttons">
                        {u.role === 'user' ? (
                          <button
                            className="usr-btn promote-btn"
                            onClick={() => handleRoleChange(u.id, 'admin')}
                            disabled={updatingId === u.id}
                            title="Promote to Admin"
                          >
                            {updatingId === u.id
                              ? <i className="fas fa-spinner fa-spin"></i>
                              : <><i className="fas fa-arrow-up"></i> Promote</>}
                          </button>
                        ) : (
                          <button
                            className="usr-btn demote-btn"
                            onClick={() => handleRoleChange(u.id, 'user')}
                            disabled={updatingId === u.id}
                            title="Demote to User"
                          >
                            {updatingId === u.id
                              ? <i className="fas fa-spinner fa-spin"></i>
                              : <><i className="fas fa-arrow-down"></i> Demote</>}
                          </button>
                        )}
                        <button
                          className="usr-btn delete-btn"
                          onClick={() => handleDelete(u.id, u.username)}
                          disabled={deletingId === u.id}
                          title="Delete User"
                        >
                          {deletingId === u.id
                            ? <i className="fas fa-spinner fa-spin"></i>
                            : <i className="fas fa-trash-alt"></i>}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx>{`
        .filters-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 1rem;
          padding: 1rem 1.25rem;
          margin-bottom: 1.5rem;
        }
        .filters-row {
          display: flex;
          gap: 1rem;
          align-items: center;
          flex-wrap: wrap;
        }
        .search-input-wrap {
          flex: 1;
          min-width: 220px;
          display: flex;
          align-items: center;
          gap: .6rem;
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: .6rem;
          padding: .5rem .9rem;
        }
        .search-input-wrap i { color: var(--color-text-muted); }
        .search-input-wrap input {
          border: none;
          background: transparent;
          color: var(--color-text);
          font-size: .9rem;
          width: 100%;
          outline: none;
        }
        .role-select {
          padding: .55rem .9rem;
          border: 1px solid var(--color-border);
          border-radius: .6rem;
          background: var(--color-bg);
          color: var(--color-text);
          font-size: .9rem;
          cursor: pointer;
        }
        .refresh-btn {
          padding: .55rem 1rem;
          border: 1px solid var(--color-border);
          border-radius: .6rem;
          background: var(--color-bg);
          color: var(--color-text);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: .4rem;
          font-size: .85rem;
          transition: all .2s;
        }
        .refresh-btn:hover { border-color: #06b6d4; color: #06b6d4; }

        .users-table-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 1rem;
          overflow: hidden;
        }
        .table-wrapper { overflow-x: auto; }
        .users-table {
          width: 100%;
          border-collapse: collapse;
          font-size: .875rem;
        }
        .users-table th {
          background: var(--color-bg);
          padding: .85rem 1rem;
          text-align: left;
          font-size: .75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .05em;
          color: var(--color-text-muted);
          border-bottom: 1px solid var(--color-border);
          white-space: nowrap;
        }
        .users-table td {
          padding: .85rem 1rem;
          border-bottom: 1px solid var(--color-border);
          color: var(--color-text);
          vertical-align: middle;
        }
        .users-table tr:last-child td { border-bottom: none; }
        .users-table tr:hover td { background: var(--color-bg); }

        .user-cell {
          display: flex;
          align-items: center;
          gap: .65rem;
        }
        .user-thumb {
          width: 36px; height: 36px;
          border-radius: 50%;
          object-fit: cover;
          flex-shrink: 0;
          border: 2px solid var(--color-border);
        }
        .user-name { font-weight: 600; }
        .email-cell { color: var(--color-text-muted); font-size: .82rem; }
        .date-cell  { color: var(--color-text-muted); font-size: .82rem; white-space: nowrap; }

        .role-badge {
          display: inline-flex;
          align-items: center;
          gap: .3rem;
          padding: .2rem .65rem;
          border-radius: 1rem;
          font-size: .75rem;
          font-weight: 700;
          text-transform: capitalize;
        }
        .badge-admin { background: #ede9fe; color: #6d28d9; }
        .badge-user  { background: #dbeafe; color: #1e40af; }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: .3rem;
          padding: .2rem .65rem;
          border-radius: 1rem;
          font-size: .75rem;
          font-weight: 600;
        }
        .badge-confirmed   { background: #d1fae5; color: #065f46; }
        .badge-unconfirmed { background: #fef3c7; color: #92400e; }

        .google-tag, .email-tag {
          display: inline-flex;
          align-items: center;
          gap: .3rem;
          font-size: .78rem;
          color: var(--color-text-muted);
        }

        .action-buttons {
          display: flex;
          gap: .5rem;
          align-items: center;
        }
        .usr-btn {
          display: inline-flex;
          align-items: center;
          gap: .35rem;
          padding: .4rem .75rem;
          border-radius: .5rem;
          font-size: .78rem;
          font-weight: 600;
          cursor: pointer;
          border: 1.5px solid transparent;
          transition: all .2s;
          white-space: nowrap;
          height: 34px;
        }
        .usr-btn:disabled { opacity: .5; cursor: not-allowed; }
        .promote-btn { background: #d1fae5; color: #065f46; border-color: #6ee7b7; }
        .promote-btn:hover:not(:disabled) { background: #10b981; color: white; }
        .demote-btn  { background: #fef3c7; color: #92400e; border-color: #fcd34d; }
        .demote-btn:hover:not(:disabled)  { background: #f59e0b; color: white; }
        .delete-btn  { background: none; color: var(--color-text-muted); border-color: var(--color-border); padding: .35rem .55rem; }
        .delete-btn:hover:not(:disabled)  { background: #fee2e2; color: #ef4444; border-color: #fca5a5; }

        .table-loading {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: .75rem;
        }
        .skeleton-row {
          height: 52px;
          background: linear-gradient(90deg, var(--color-bg) 25%, var(--color-border) 50%, var(--color-bg) 75%);
          background-size: 400% 100%;
          animation: shimmer 1.4s ease infinite;
          border-radius: .5rem;
        }
        @keyframes shimmer {
          0%   { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }

        .dashboard-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.25rem;
        }
        .stat-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 1rem;
          padding: 1.25rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .stat-icon {
          width: 46px; height: 46px;
          border-radius: .75rem;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.25rem; color: white; flex-shrink: 0;
        }
        .stat-icon.blue   { background: #3b82f6; }
        .stat-icon.purple { background: #8b5cf6; }
        .stat-icon.green  { background: #10b981; }
        .stat-info h3 { font-size: 1.4rem; font-weight: 700; color: var(--color-text); }
        .stat-info p  { color: var(--color-text-muted); font-size: .85rem; }

        @media (max-width: 640px) {
          .filters-row { flex-direction: column; }
          .search-input-wrap { width: 100%; }
        }
      `}</style>
    </div>
  );
}