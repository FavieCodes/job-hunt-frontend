'use client';
import { useEffect, useState, useRef } from 'react';
import { getUser, changePassword } from '@/lib/auth';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [avatar, setAvatar] = useState('');
  const [uploading, setUploading] = useState(false);
  const [savingUsername, setSavingUsername] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const userData = getUser();
    if (userData) {
      setUser(userData);
      setUsername(userData.username || '');
    }
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/user/profile');
      if (data.avatar) setAvatar(data.avatar);
      if (data.is_google_user !== undefined) {
        setUser((prev: any) =>
          prev ? { ...prev, is_google_user: data.is_google_user, created_at: data.created_at } : prev
        );
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  // ── Avatar upload ─────────────────────────────────────────────────────────

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    // Allow up to 5 MB on the client side (server accepts up to 10 MB base64)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5 MB');
      return;
    }

    setUploading(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64String = reader.result as string;
        // Send ONLY avatar — do not touch username
        const { data } = await api.patch('/user/profile', { avatar: base64String });
        const newAvatar = data.avatar || base64String;
        setAvatar(newAvatar);

        // Persist updated avatar to cookie
        const stored = getUser();
        if (stored) {
          const updated = { ...stored, avatar: newAvatar };
          Cookies.set('user', JSON.stringify(updated), { expires: 7 });
          setUser(updated);
        }
        toast.success('Profile picture updated!');
      } catch (error: any) {
        const msg = error?.response?.data?.error || 'Failed to upload avatar';
        toast.error(msg);
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.onerror = () => {
      toast.error('Failed to read image file');
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  // ── Username update ───────────────────────────────────────────────────────

  const handleUpdateUsername = async () => {
    const trimmed = username.trim();
    if (!trimmed) { toast.error('Username cannot be empty'); return; }
    if (trimmed === user?.username) { setIsEditing(false); return; }

    setSavingUsername(true);
    try {
      // Send ONLY username — do not touch avatar
      await api.patch('/user/profile', { username: trimmed });
      const stored = getUser();
      if (stored) {
        const updated = { ...stored, username: trimmed };
        Cookies.set('user', JSON.stringify(updated), { expires: 7 });
        setUser(updated);
      }
      toast.success('Username updated successfully');
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Update failed');
    } finally {
      setSavingUsername(false);
    }
  };

  // ── Password change ───────────────────────────────────────────────────────

  const handleChangePassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (formData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (formData.newPassword === formData.currentPassword) {
      toast.error('New password must differ from current password');
      return;
    }

    try {
      await changePassword(
        formData.currentPassword,
        formData.newPassword,
        formData.confirmPassword
      );
      toast.success('Password changed successfully');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to change password');
    }
  };

  if (!user) return null;

  const isGoogleUser = user?.is_google_user === true;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1><i className="fas fa-user-circle"></i> My Profile</h1>
        <p>Manage your account settings and preferences</p>
      </div>

      <div className="profile-grid">

        {/* ── Avatar ─────────────────────────────────────────────────────── */}
        <div className="profile-card">
          <h3>Profile Picture</h3>
          <div className="avatar-section">
            <div className="avatar-wrapper" onClick={handleAvatarClick}>
              <img
                src={
                  avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=06b6d4&color=fff&size=120`
                }
                alt={user.username}
                className="profile-avatar"
                key={avatar}
              />
              <div className="avatar-overlay">
                <i className="fas fa-camera"></i>
                <span>Change Photo</span>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              style={{ display: 'none' }}
            />
            {uploading && (
              <p className="uploading-text">
                <i className="fas fa-spinner fa-spin"></i> Uploading…
              </p>
            )}
            <p className="avatar-hint">Click image to change • Max 5 MB</p>
          </div>
        </div>

        {/* ── Personal info ───────────────────────────────────────────────── */}
        <div className="profile-card">
          <div className="card-header">
            <h3>Personal Information</h3>
            <button
              onClick={() => { setIsEditing(!isEditing); setUsername(user.username); }}
              className="edit-btn"
            >
              <i className={`fas ${isEditing ? 'fa-times' : 'fa-pen'}`}></i>
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          <div className="profile-info">
            <div className="info-field">
              <label>Username</label>
              {isEditing ? (
                <div className="edit-row">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateUsername(); }}
                    autoFocus
                  />
                  <button
                    onClick={handleUpdateUsername}
                    className="save-inline-btn"
                    disabled={savingUsername}
                  >
                    {savingUsername ? <i className="fas fa-spinner fa-spin"></i> : 'Save'}
                  </button>
                </div>
              ) : (
                <p>{user.username}</p>
              )}
            </div>

            <div className="info-field">
              <label>Email Address</label>
              <p>{user.email}</p>
            </div>

            <div className="info-field">
              <label>Account Type</label>
              <p className="role-badge">
                {user.role === 'admin' ? 'Administrator' : 'Regular User'}
              </p>
            </div>

            {isGoogleUser && (
              <div className="info-field">
                <label>Sign-in Method</label>
                <p className="google-badge">
                  <i className="fab fa-google"></i> Google Account
                </p>
              </div>
            )}

            <div className="info-field">
              <label>Member Since</label>
              <p>{user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</p>
            </div>
          </div>
        </div>

        {/* ── Change Password ─────────────────────────────────────────────── */}
        <div className="profile-card">
          <h3>Change Password</h3>

          {isGoogleUser ? (
            <div className="google-password-notice">
              <div className="notice-icon"><i className="fab fa-google"></i></div>
              <div>
                <p className="notice-title">Password change not available</p>
                <p className="notice-body">
                  Your account is linked to Google — there is no password to change here.
                  Manage security at{' '}
                  <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer">
                    myaccount.google.com
                  </a>.
                </p>
              </div>
            </div>
          ) : (
            <div className="password-form">
              <div className="form-field">
                <label>Current Password</label>
                <input
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                />
              </div>
              <div className="form-field">
                <label>New Password</label>
                <input
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  placeholder="Min. 8 characters"
                />
              </div>
              <div className="form-field">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Confirm your new password"
                />
              </div>
              <button onClick={handleChangePassword} className="change-password-btn">
                Update Password
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .avatar-wrapper {
          position: relative; display: inline-block; cursor: pointer;
        }
        .avatar-overlay {
          position: absolute; top:0; left:0; right:0; bottom:0;
          background: rgba(0,0,0,.6); border-radius: 50%;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          opacity: 0; transition: opacity 0.3s; color: white;
        }
        .avatar-wrapper:hover .avatar-overlay { opacity: 1; }
        .avatar-overlay i    { font-size: 1.5rem; margin-bottom: 0.25rem; }
        .avatar-overlay span { font-size: 0.75rem; }
        .uploading-text {
          margin-top: 0.5rem; color: var(--color-primary);
          font-size: 0.875rem; display: flex; align-items: center; gap: 0.4rem;
        }
        .avatar-hint { margin-top: 0.5rem; font-size: 0.75rem; color: var(--color-text-muted); }
        .edit-row { display: flex; gap: 0.5rem; align-items: center; }
        .edit-row input { flex: 1; }
        .save-inline-btn {
          padding: 0.45rem 0.9rem;
          background: #06b6d4; color: white;
          border: none; border-radius: 0.5rem;
          cursor: pointer; font-weight: 600; font-size: 0.85rem;
          white-space: nowrap;
        }
        .save-inline-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .role-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          background: #dbeafe; color: #1e40af;
          border-radius: 1rem; font-size: 0.75rem; font-weight: 500;
        }
        .google-badge {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.25rem 0.75rem;
          background: #fef3c7; color: #92400e;
          border-radius: 1rem; font-size: 0.75rem; font-weight: 500;
        }
        .google-password-notice {
          display: flex; align-items: flex-start; gap: 1rem;
          background: #f0f9ff; border: 1px solid #bae6fd;
          border-radius: 0.75rem; padding: 1.25rem;
        }
        .notice-icon {
          flex-shrink: 0; width: 2.5rem; height: 2.5rem;
          border-radius: 50%; background: #dbeafe;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.1rem; color: #1d4ed8;
        }
        .notice-title { font-weight: 600; color: var(--color-text); margin-bottom: 0.35rem; }
        .notice-body  { font-size: 0.875rem; color: var(--color-text-muted); line-height: 1.5; }
        .notice-body a { color: #06b6d4; text-decoration: underline; }
      `}</style>
    </div>
  );
}