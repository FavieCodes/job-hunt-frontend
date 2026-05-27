'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  is_confirmed: boolean;
  created_at: string;
  avatar: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      toast.success('User role updated successfully');
      fetchUsers();
      setShowRoleModal(false);
    } catch (error) {
      toast.error('Failed to update user role');
    }
  };

  const deleteUser = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await api.delete(`/admin/users/${userId}`);
        toast.success('User deleted successfully');
        fetchUsers();
      } catch (error) {
        toast.error('Failed to delete user');
      }
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadgeColor = (role: string) => {
    return role === 'admin' ? '#ef4444' : '#10b981';
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div className="profile-header">
        <h1><i className="fas fa-users"></i> Users Management</h1>
        <p>Manage all registered users on the platform</p>
      </div>

      {/* Search Bar */}
      <div className="admin-search-bar">
        <i className="fas fa-search"></i>
        <input
          type="text"
          placeholder="Search by username or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <span className="user-count">{filteredUsers.length} users found</span>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="skeleton-card">Loading users...</div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Avatar</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <img
                      src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=06b6d4&color=fff`}
                      alt={user.username}
                      className="user-avatar-table"
                    />
                  </td>
                  <td><strong>{user.username}</strong></td>
                  <td>{user.email}</td>
                  <td>
                    <span className="role-badge" style={{ backgroundColor: getRoleBadgeColor(user.role) }}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${user.is_confirmed ? 'confirmed' : 'unconfirmed'}`}>
                      {user.is_confirmed ? '✅ Confirmed' : '⏳ Pending'}
                    </span>
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="user-actions">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowRoleModal(true);
                        }}
                        className="action-btn edit"
                        title="Change Role"
                      >
                        <i className="fas fa-user-tag"></i>
                      </button>
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="action-btn delete"
                        title="Delete User"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Role Change Modal */}
      {showRoleModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowRoleModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Change User Role</h3>
              <button onClick={() => setShowRoleModal(false)} className="modal-close">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <p>User: <strong>{selectedUser.username}</strong></p>
              <p>Email: {selectedUser.email}</p>
              <div className="role-options">
                <button
                  onClick={() => updateUserRole(selectedUser.id, 'user')}
                  className={`role-option ${selectedUser.role === 'user' ? 'active' : ''}`}
                >
                  <i className="fas fa-user"></i> Regular User
                </button>
                <button
                  onClick={() => updateUserRole(selectedUser.id, 'admin')}
                  className={`role-option admin ${selectedUser.role === 'admin' ? 'active' : ''}`}
                >
                  <i className="fas fa-shield-alt"></i> Administrator
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .admin-search-bar {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 0.75rem;
          padding: 1rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .admin-search-bar i {
          color: var(--color-text-muted);
        }
        .admin-search-bar input {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          color: var(--color-text);
          font-size: 1rem;
        }
        .user-count {
          color: var(--color-text-muted);
          font-size: 0.875rem;
        }
        .users-table-container {
          background: var(--color-surface);
          border-radius: 1rem;
          overflow-x: auto;
          border: 1px solid var(--color-border);
        }
        .users-table {
          width: 100%;
          border-collapse: collapse;
        }
        .users-table th {
          text-align: left;
          padding: 1rem;
          background: var(--color-surface-2);
          color: var(--color-text);
          font-weight: 600;
        }
        .users-table td {
          padding: 1rem;
          border-bottom: 1px solid var(--color-border);
          color: var(--color-text);
        }
        .user-avatar-table {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
        }
        .role-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: white;
          text-transform: uppercase;
        }
        .status-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 500;
        }
        .status-badge.confirmed {
          background: #d1fae5;
          color: #065f46;
        }
        .status-badge.unconfirmed {
          background: #fed7aa;
          color: #92400e;
        }
        .user-actions {
          display: flex;
          gap: 0.5rem;
        }
        .action-btn {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .action-btn.edit {
          background: #dbeafe;
          color: #1e40af;
        }
        .action-btn.edit:hover {
          background: #bfdbfe;
        }
        .action-btn.delete {
          background: #fee2e2;
          color: #dc2626;
        }
        .action-btn.delete:hover {
          background: #fecaca;
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: var(--color-surface);
          border-radius: 1rem;
          width: 90%;
          max-width: 400px;
          box-shadow: var(--shadow-lg);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--color-border);
        }
        .modal-body {
          padding: 1.5rem;
        }
        .role-options {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }
        .role-option {
          flex: 1;
          padding: 0.75rem;
          border: 2px solid var(--color-border);
          background: var(--color-bg);
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .role-option.active {
          border-color: #06b6d4;
          background: #cffafe;
          color: #0891b2;
        }
        .role-option.admin.active {
          border-color: #ef4444;
          background: #fee2e2;
          color: #dc2626;
        }
      `}</style>
    </div>
  );
}