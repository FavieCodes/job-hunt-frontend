'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { getUser, logout } from '@/lib/auth';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import Cookies from 'js-cookie';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [user, setUser]                     = useState<any>(null);
  const [isDarkMode, setIsDarkMode]         = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileMenuOpen, setMobileMenu]   = useState(false);
  const [isScraping, setIsScraping]         = useState(false);
  const [routeLoading, setRouteLoading]     = useState(false);
  const [progress, setProgress]             = useState(0);
  const progressTimer                        = useRef<any>(null);

  useEffect(() => {
    const userData = getUser();
    if (!userData) { router.push('/login'); return; }
    setUser(userData);

    api.get('/user/profile')
      .then(({ data }) => {
        if (data.avatar || data.username) {
          const updated = { ...userData, ...data };
          Cookies.set('user', JSON.stringify(updated), { expires: 7 });
          setUser(updated);
        }
      })
      .catch(() => {});

    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, [router]);

  // Close settings dropdown when clicking outside
  useEffect(() => {
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.settings-dropdown')) setIsSettingsOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  // Close mobile sidebar whenever the route changes
  useEffect(() => {
    setMobileMenu(false);
  }, [pathname]);

  // Route-change progress bar
  useEffect(() => {
    // Start progress on pathname change
    setRouteLoading(true);
    setProgress(10);
    if (progressTimer.current) clearInterval(progressTimer.current);

    progressTimer.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 85) {
          clearInterval(progressTimer.current);
          return 85;
        }
        return p + Math.random() * 12;
      });
    }, 200);

    // Finish after a short delay (page has rendered)
    const finish = setTimeout(() => {
      clearInterval(progressTimer.current);
      setProgress(100);
      setTimeout(() => {
        setRouteLoading(false);
        setProgress(0);
      }, 300);
    }, 500);

    return () => {
      clearInterval(progressTimer.current);
      clearTimeout(finish);
    };
  }, [pathname]);

  const toggleDarkMode = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    if (next) {
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
      await api.post('/scraper/trigger');
      toast.success('Scraping started! New jobs will appear shortly.');
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to start scraping.');
    } finally {
      setIsScraping(false);
    }
  };

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  const navItems = isAdmin
    ? [
        { href: '/dashboard',    icon: 'fa-home',           label: 'Dashboard' },
        { href: '/jobs',         icon: 'fa-briefcase',      label: 'Jobs' },
        { href: '/scholarships', icon: 'fa-graduation-cap', label: 'Scholarships' },
        { href: '/admin/users',  icon: 'fa-users',          label: 'Users Management' },
      ]
    : [
        { href: '/dashboard',    icon: 'fa-home',           label: 'Dashboard' },
        { href: '/jobs',         icon: 'fa-briefcase',      label: 'Jobs' },
        { href: '/scholarships', icon: 'fa-graduation-cap', label: 'Scholarships' },
        { href: '/applications', icon: 'fa-file-alt',       label: 'My Applications' },
        { href: '/saved',        icon: 'fa-bookmark',       label: 'Saved Items' },
        { href: '/interview',    icon: 'fa-comments',       label: 'Interview Prep' },
        { href: '/resume',       icon: 'fa-file-alt',       label: 'Resume Builder' },
        { href: '/portfolio',    icon: 'fa-globe',           label: 'Portfolio Builder' },
      ];

  const avatarSrc =
    user?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'U')}&background=06b6d4&color=fff`;

  return (
    <div className={`dashboard-container ${isDarkMode ? 'dark' : ''}`}>

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>

      
        <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" className="logo" style={{ textDecoration: 'none' }}>
            <i className="fas fa-briefcase"></i>
            <span>Job<span>Hunt</span></span>
          </Link>

          {/* Close button */}
          <button
            className="mobile-close-btn"
            onClick={() => setMobileMenu(false)}
            aria-label="Close menu"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Nav links — each closes the sidebar on mobile via the pathname effect */}
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${pathname === item.href ? 'active' : ''}`}
              onClick={() => setMobileMenu(false)}
            >
              <i className={`fas ${item.icon}`}></i>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {isAdmin && (
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

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <main className="main-content">
        <header className="top-bar">
          <button className="mobile-menu-btn" onClick={() => setMobileMenu(true)}>
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
            <div className="settings-dropdown">
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="settings-btn"
                title="Settings"
              >
                <i className="fas fa-cog"></i>
              </button>

              {isSettingsOpen && (
                <div className="dropdown-menu">
                  <Link href="/profile" className="dropdown-item" onClick={() => setIsSettingsOpen(false)}>
                    <i className="fas fa-user-circle"></i> My Profile
                  </Link>
                  <button className="dropdown-item" onClick={toggleDarkMode}>
                    <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
                    {isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  </button>
                  <hr />
                  <button
                    onClick={() => { handleLogout(); setIsSettingsOpen(false); }}
                    className="dropdown-item logout-item"
                  >
                    <i className="fas fa-sign-out-alt"></i> Logout
                  </button>
                </div>
              )}
            </div>

            <Link href="/profile" className="user-avatar" title="My Profile">
              <img key={avatarSrc} src={avatarSrc} alt={user?.username} />
            </Link>
          </div>
        </header>

        <div className="page-content">{children}</div>
      </main>

      {/* ── Route-change progress bar ──────────────────────────────────────── */}
      {routeLoading && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            height: '3px',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #06b6d4, #1e3a8a)',
            zIndex: 99999,
            transition: progress === 100 ? 'width .15s ease, opacity .3s ease' : 'width .2s ease',
            opacity: progress === 100 ? 0 : 1,
            borderRadius: '0 2px 2px 0',
            boxShadow: '0 0 10px rgba(6,182,212,.6)',
          }}
        />
      )}

      {/* ── Mobile overlay — tap outside to close ────────────────────────── */}
      {isMobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setMobileMenu(false)}></div>
      )}

      {/* ── Scoped styles for the close button ───────────────────────────── */}
      <style jsx global>{`
        /* Hide close btn on desktop; show on mobile */
        .mobile-close-btn {
          display: none;
          background: none;
          border: 2px solid var(--color-border);
          border-radius: 0.5rem;
          width: 36px;
          height: 36px;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--color-text);
          font-size: 1.1rem;
          font-weight: 900;
          transition: background 0.2s, color 0.2s, border-color 0.2s;
          flex-shrink: 0;
        }
        .mobile-close-btn:hover {
          background: var(--color-danger-light, #fee2e2);
          color: var(--color-danger, #ef4444);
          border-color: var(--color-danger, #ef4444);
        }
        .mobile-close-btn .fas.fa-times {
          font-weight: 900;
          font-size: 1.1rem;
        }

        @media (max-width: 768px) {
          .mobile-close-btn {
            display: flex;
          }
          /* Give the logo and close button breathing room */
          .sidebar-header {
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  );
}