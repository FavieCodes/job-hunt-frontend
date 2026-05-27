'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { logout } from '@/lib/auth';
import toast from 'react-hot-toast';

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: any;
}

export default function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    router.push('/login');
  };

  return (
    <div className={`dashboard-container ${isDarkMode ? 'dark' : ''}`}>
      {/* Sidebar */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <i className="fas fa-briefcase"></i>
            <span>Job<span>Hunt</span></span>
          </div>
          <button className="mobile-close" onClick={() => setIsMobileMenuOpen(false)}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <nav className="sidebar-nav">
          <Link href="/jobs" className="nav-item active">
            <i className="fas fa-home"></i>
            <span>Dashboard</span>
          </Link>
          <Link href="/applications" className="nav-item">
            <i className="fas fa-file-alt"></i>
            <span>My Applications</span>
          </Link>
          <Link href="/saved" className="nav-item">
            <i className="fas fa-bookmark"></i>
            <span>Saved Jobs</span>
          </Link>
          <Link href="/profile" className="nav-item">
            <i className="fas fa-user"></i>
            <span>Profile</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <i className="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Top Bar */}
        <header className="top-bar">
          <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)}>
            <i className="fas fa-bars"></i>
          </button>

          <div className="search-bar">
            <i className="fas fa-search"></i>
            <input type="text" placeholder="Search jobs or scholarships..." />
          </div>

          <div className="top-bar-actions">
            <button onClick={toggleDarkMode} className="theme-toggle">
              <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
            </button>

            <div className="settings-dropdown">
              <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="settings-btn">
                <i className="fas fa-cog"></i>
              </button>
              {isSettingsOpen && (
                <div className="dropdown-menu">
                  <Link href="/profile" className="dropdown-item">
                    <i className="fas fa-user-circle"></i> My Profile
                  </Link>
                  <Link href="/settings" className="dropdown-item">
                    <i className="fas fa-sliders-h"></i> Account Settings
                  </Link>
                  <Link href="/notifications" className="dropdown-item">
                    <i className="fas fa-bell"></i> Notifications
                  </Link>
                  <hr />
                  <button onClick={handleLogout} className="dropdown-item logout-item">
                    <i className="fas fa-sign-out-alt"></i> Logout
                  </button>
                </div>
              )}
            </div>

            <div className="user-avatar">
              <img src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.username}&background=06b6d4&color=fff`} alt={user?.username} />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="page-content">
          {children}
        </div>
      </main>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>}
    </div>
  );
}