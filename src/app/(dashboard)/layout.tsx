'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { getUser, logout } from '@/lib/auth';
import toast from 'react-hot-toast';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScraping, setIsScraping] = useState(false);

  useEffect(() => {
    const userData = getUser();
    if (!userData) {
      router.push('/login');
      return;
    }
    setUser(userData);

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, [router]);

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
    router.push('/');
  };

  const triggerScraping = async () => {
    setIsScraping(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/scraper/trigger`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        toast.success('Scraping started! New jobs will appear shortly.');
      } else {
        toast.error('Failed to start scraping. Please try again.');
      }
    } catch (error) {
      toast.error('Error triggering scraper');
    } finally {
      setIsScraping(false);
    }
  };

  if (!user) return null;

  const navItems = [
    { href: '/dashboard', icon: 'fa-home', label: 'Dashboard' },
    { href: '/jobs', icon: 'fa-briefcase', label: 'Jobs' },
    { href: '/scholarships', icon: 'fa-graduation-cap', label: 'Scholarships' },
    { href: '/applications', icon: 'fa-file-alt', label: 'My Applications' },
    { href: '/saved', icon: 'fa-bookmark', label: 'Saved Jobs' },
  ];

  // Add admin menu if user is admin
  if (user.role === 'admin') {
    navItems.push({ href: '/admin/users', icon: 'fa-users', label: 'Users Management' });
  }

  return (
    <div className={`dashboard-container ${isDarkMode ? 'dark' : ''}`}>
      {/* Sidebar */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <Link href="/" className="logo" style={{ textDecoration: 'none' }}>
            <i className="fas fa-briefcase"></i>
            <span>Job<span>Hunt</span></span>
          </Link>
          <button className="mobile-close" onClick={() => setIsMobileMenuOpen(false)}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${pathname === item.href ? 'active' : ''}`}
            >
              <i className={`fas ${item.icon}`}></i>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Scraper Trigger Button - Only for admin or show to all authenticated users */}
        {(user.role === 'admin' || user.role === 'user') && (
          <div className="scraper-trigger-container">
            <button 
              onClick={triggerScraping} 
              className="scraper-trigger-btn"
              disabled={isScraping}
            >
              <i className={`fas fa-robot ${isScraping ? 'fa-spin' : ''}`}></i>
              <span>{isScraping ? 'Scraping in progress...' : '🔄 Force Scrape Now'}</span>
            </button>
            <p className="scraper-hint">Manually trigger job/scholarship scraping</p>
          </div>
        )}

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
            <input 
              type="text" 
              placeholder="Search jobs or scholarships..." 
              id="globalSearch"
              onChange={(e) => {
                if (pathname === '/jobs') {
                  window.dispatchEvent(new CustomEvent('globalSearch', { detail: e.target.value }));
                }
              }}
            />
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
                    <i className="fas fa-bell"></i> Notifications
                  </Link>
                  <hr />
                  <button onClick={handleLogout} className="dropdown-item logout-item">
                    <i className="fas fa-sign-out-alt"></i> Logout
                  </button>
                </div>
              )}
            </div>

            {/* Profile Picture Link */}
            <Link href="/profile" className="user-avatar">
              <img
                src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.username}&background=06b6d4&color=fff`}
                alt={user?.username}
              />
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <div className="page-content">{children}</div>
      </main>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>}
    </div>
  );
}