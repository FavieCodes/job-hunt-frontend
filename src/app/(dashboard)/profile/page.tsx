'use client';
import { useEffect, useState, useRef } from 'react';
import { getUser, changePassword } from '@/lib/auth';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [username, setUsername] = useState('');
  const [savingUsername, setSavingUsername] = useState(false);

  const [avatar, setAvatar] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

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
        setUser((prev: any) => prev ? { ...prev, is_google_user: data.is_google_user } : prev);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  // ── Avatar ──────────────────────────────────────────────────────────────────

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2 MB');
      return;
    }

    setUploading(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64String = reader.result as string;
        // PATCH only the avatar field — username is NOT sent here
        const { data } = await api.patch('/user/profile', { avatar: base64String });
        setAvatar(data.avatar);

        // Persist new avatar in the cookie so it survives page refresh
        const stored = getUser();
        if (stored) {
          const updated = { ...stored, avatar: data.avatar };
          Cookies.set('user', JSON.stringify(updated), { expires: 7 });
          setUser(updated);
        }
        toast.success('Profile picture updated!');
      } catch (error: any) {
        const msg = error?.response?.data?.error || 'Failed to upload profile picture';
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

  // ── Username ────────────────────────────────────────────────────────────────

  const handleSaveUsername = async () => {
    if (!username.trim()) {
      toast.error('Username cannot be empty');
      return;
    }
    setSavingUsername(true);
    try {
      // PATCH only the username field — avatar is NOT sent here
      await api.patch('/user/profile', { username: username.trim() });
      const stored = getUser();
      if (stored) {
        const updated = { ...stored, username: username.trim() };
        Cookies.set('user', JSON.stringify(updated), { expires: 7 });
        setUser(updated);
      }
      toast.success('Username updated!');
      setIsEditingUsername(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update username');
    } finally {
      setSavingUsername(false);
    }
  };

  // ── Password ────────────────────────────────────────────────────────────────

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (passwordForm.newPassword === passwordForm.currentPassword) {
      toast.error('New password must be different from current password');
      return;
    }
    try {
      await changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword,
        passwordForm.confirmPassword
      );
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
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
            <div className="avatar-wrapper" onClick={handleAvatarClick} style={{ cursor: 'pointer' }}>
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
            <p className="avatar-hint">Click the image to change your profile picture</p>
          </div>
        </div>

        {/* ── Personal Information ────────────────────────────────────────── */}
        <div className="profile-card">
          <h3>Personal Information</h3>

          <div className="profile-info">
            {/* Username — independent edit */}
            <div className="info-field">
              <label>Username</label>
              {isEditingUsername ? (
                <div className="inline-edit">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveUsername();
                      if (e.key === 'Escape') {
                        setUsername(user.username);
                        setIsEditingUsername(false);
                      }
                    }}
                    autoFocus
                  />
                  <div className="inline-edit-actions">
                    <button
                      className="inline-save-btn"
                      onClick={handleSaveUsername}
                      disabled={savingUsername}
                    >
                      {savingUsername
                        ? <i className="fas fa-spinner fa-spin"></i>
                        : <i className="fas fa-check"></i>}
                    </button>
                    <button
                      className="inline-cancel-btn"
                      onClick={() => { setUsername(user.username); setIsEditingUsername(false); }}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="field-display">
                  <p>{user.username}</p>
                  <button
                    className="edit-inline-btn"
                    onClick={() => setIsEditingUsername(true)}
                    title="Edit username"
                  >
                    <i className="fas fa-pen"></i>
                  </button>
                </div>
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
              <p>{new Date(user.created_at).toLocaleDateString()}</p>
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
                  Your account is linked to Google. To update security settings, visit your{' '}
                  <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer">
                    Google Account
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
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                />
              </div>
              <div className="form-field">
                <label>New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="Min. 8 characters"
                />
              </div>
              <div className="form-field">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
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
        /* ── Avatar ── */
        .avatar-wrapper { position: relative; display: inline-block; cursor: pointer; }
        .avatar-overlay {
          position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,.6); border-radius: 50%;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          opacity: 0; transition: opacity .3s; color: white;
        }
        .avatar-wrapper:hover .avatar-overlay { opacity: 1; }
        .avatar-overlay i { font-size: 1.5rem; margin-bottom: .25rem; }
        .avatar-overlay span { font-size: .75rem; }
        .uploading-text {
          margin-top: .5rem; color: var(--color-primary); font-size: .875rem;
          display: flex; align-items: center; gap: .4rem;
        }
        .avatar-hint { margin-top: .5rem; font-size: .75rem; color: var(--color-text-muted); }

        /* ── Username inline edit ── */
        .field-display { display: flex; align-items: center; gap: .75rem; }
        .field-display p { flex: 1; margin: 0; }
        .edit-inline-btn {
          background: none; border: none; color: var(--color-primary); cursor: pointer;
          font-size: .85rem; padding: .2rem .4rem; border-radius: .4rem;
          transition: background .2s;
        }
        .edit-inline-btn:hover { background: var(--color-primary-light, #e0f9ff); }
        .inline-edit { display: flex; align-items: center; gap: .5rem; }
        .inline-edit input {
          flex: 1; padding: .45rem .75rem; background: var(--color-bg);
          border: 1px solid var(--color-primary); border-radius: .5rem;
          color: var(--color-text); font-size: .95rem; outline: none;
        }
        .inline-edit-actions { display: flex; gap: .35rem; }
        .inline-save-btn {
          width: 32px; height: 32px; border-radius: .5rem;
          background: #10b981; border: none; color: white; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background .2s;
        }
        .inline-save-btn:disabled { background: #9ca3af; cursor: not-allowed; }
        .inline-cancel-btn {
          width: 32px; height: 32px; border-radius: .5rem;
          background: var(--color-bg); border: 1px solid var(--color-border);
          color: var(--color-text-muted); cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all .2s;
        }
        .inline-cancel-btn:hover { border-color: #ef4444; color: #ef4444; }

        /* ── Misc ── */
        .role-badge {
          display: inline-block; padding: .25rem .75rem;
          background: #dbeafe; color: #1e40af; border-radius: 1rem;
          font-size: .75rem; font-weight: 500;
        }
        .google-badge {
          display: inline-flex; align-items: center; gap: .4rem;
          padding: .25rem .75rem; background: #fef3c7; color: #92400e;
          border-radius: 1rem; font-size: .75rem; font-weight: 500;
        }
        .google-password-notice {
          display: flex; align-items: flex-start; gap: 1rem;
          background: #f0f9ff; border: 1px solid #bae6fd;
          border-radius: .75rem; padding: 1.25rem;
        }
        .notice-icon {
          flex-shrink: 0; width: 2.5rem; height: 2.5rem; border-radius: 50%;
          background: #dbeafe; display: flex; align-items: center; justify-content: center;
          font-size: 1.1rem; color: #1d4ed8;
        }
        .notice-title { font-weight: 600; color: var(--color-text); margin-bottom: .35rem; }
        .notice-body { font-size: .875rem; color: var(--color-text-muted); line-height: 1.5; }
        .notice-body a { color: #06b6d4; text-decoration: underline; }
      `}</style>
    </div>
  );
}