'use client';
import { useEffect, useState } from 'react';
import { getUser } from '@/lib/auth';
import api from '@/lib/api';
import Link from 'next/link';

export default function DashboardHomePage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalScholarships: 0,
    applications: 0,
    savedJobs: 0,
    totalUsers: 0,
    totalApplications: 0,
  });
  const [recentJobs, setRecentJobs] = useState([]);

  useEffect(() => {
    const userData = getUser();
    setUser(userData);
    fetchStats(userData);
    fetchRecentJobs();
  }, []);

  const fetchStats = async (userData: any) => {
    const isAdmin = userData?.role === 'admin';
    try {
      if (isAdmin) {
        // Admin: fetch platform-wide numbers
        const [jobsRes, scholarshipsRes, usersRes] = await Promise.all([
          api.get('/jobs?page=1&limit=1'),
          api.get('/scholarships?page=1&limit=1'),
          api.get('/admin/users'),
        ]);
        setStats({
          totalJobs: jobsRes.data.total || 0,
          totalScholarships: scholarshipsRes.data.total || 0,
          applications: 0,
          savedJobs: 0,
          totalUsers: usersRes.data.length || 0,
          totalApplications: 0,
        });
      } else {
        // Regular user: fetch personal numbers
        const [jobsRes, scholarshipsRes, applicationsRes, savedRes] = await Promise.all([
          api.get('/jobs?page=1&limit=1'),
          api.get('/scholarships?page=1&limit=1'),
          api.get('/user/applications'),
          api.get('/user/saved'),
        ]);
        setStats({
          totalJobs: jobsRes.data.total || 0,
          totalScholarships: scholarshipsRes.data.total || 0,
          applications: applicationsRes.data.length || 0,
          savedJobs: savedRes.data.length || 0,
          totalUsers: 0,
          totalApplications: 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchRecentJobs = async () => {
    try {
      const { data } = await api.get('/jobs?page=1&limit=5');
      setRecentJobs(data.jobs || []);
    } catch (error) {
      console.error('Failed to fetch recent jobs:', error);
    }
  };

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Welcome Banner */}
      <div className="welcome-section">
        <div>
          <h1 className="welcome-title">
            {isAdmin ? `Admin Dashboard 🛡️` : `Welcome back, ${user.username}! 👋`}
          </h1>
          <p className="welcome-subtitle">
            {isAdmin
              ? 'Manage jobs, scholarships, and users across the platform'
              : "Here's what's happening with your job search today"}
          </p>
        </div>
        <div className="stats-badge">
          <span className="stat-badge">
            <i className="fas fa-briefcase"></i> {stats.totalJobs}+ Jobs
          </span>
          <span className="stat-badge">
            <i className="fas fa-graduation-cap"></i> {stats.totalScholarships}+ Scholarships
          </span>
        </div>
      </div>

      {/* Stats Cards — different for admin vs user */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon blue">
            <i className="fas fa-briefcase"></i>
          </div>
          <div className="stat-info">
            <h3>{stats.totalJobs}+</h3>
            <p>Total Jobs</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon cyan">
            <i className="fas fa-graduation-cap"></i>
          </div>
          <div className="stat-info">
            <h3>{stats.totalScholarships}+</h3>
            <p>Scholarships</p>
          </div>
        </div>

        {isAdmin ? (
          <>
            <div className="stat-card">
              <div className="stat-icon green">
                <i className="fas fa-users"></i>
              </div>
              <div className="stat-info">
                <h3>{stats.totalUsers}</h3>
                <p>Registered Users</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon purple">
                <i className="fas fa-cogs"></i>
              </div>
              <div className="stat-info">
                <h3>Admin</h3>
                <p>Full Access</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="stat-card">
              <div className="stat-icon green">
                <i className="fas fa-file-alt"></i>
              </div>
              <div className="stat-info">
                <h3>{stats.applications}</h3>
                <p>Applications Sent</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon purple">
                <i className="fas fa-bookmark"></i>
              </div>
              <div className="stat-info">
                <h3>{stats.savedJobs}</h3>
                <p>Saved Jobs</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Recent Jobs */}
      <div className="recent-section">
        <div className="section-header">
          <h2>
            <i className="fas fa-clock"></i> Recently Added Jobs
          </h2>
          <Link href="/jobs" className="view-all">
            View All →
          </Link>
        </div>
        <div className="recent-jobs-list">
          {recentJobs.map((job: any) => (
            <div key={job.id} className="recent-job-item">
              <div className="recent-job-icon">{job.company?.[0] || 'J'}</div>
              <div className="recent-job-info">
                <h4>{job.title}</h4>
                <p>
                  {job.company || 'Remote Company'} •{' '}
                  {job.city || job.country || 'Remote'}
                </p>
              </div>
              <div className="recent-job-type">
                <span className="job-type-badge">{job.job_type || 'Full-time'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions — role-specific */}
      <div className="quick-actions-section">
        <div className="section-header">
          <h2>
            <i className="fas fa-bolt"></i> Quick Actions
          </h2>
        </div>
        <div className="quick-actions-grid">
          <Link href="/jobs" className="quick-action-card">
            <i className="fas fa-search"></i>
            <span>Browse Jobs</span>
          </Link>
          <Link href="/scholarships" className="quick-action-card">
            <i className="fas fa-graduation-cap"></i>
            <span>Find Scholarships</span>
          </Link>
          {isAdmin ? (
            <>
              <Link href="/admin/users" className="quick-action-card">
                <i className="fas fa-users"></i>
                <span>Manage Users</span>
              </Link>
              <Link href="/admin/jobs" className="quick-action-card">
                <i className="fas fa-plus-circle"></i>
                <span>Add Jobs</span>
              </Link>
            </>
          ) : (
            <>
              <Link href="/applications" className="quick-action-card">
                <i className="fas fa-file-alt"></i>
                <span>Track Applications</span>
              </Link>
              <Link href="/interview" className="quick-action-card">
                <i className="fas fa-comments"></i>
                <span>Interview Prep</span>
              </Link>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .dashboard-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        .stat-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 1rem;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: transform 0.2s;
        }
        .stat-card:hover { transform: translateY(-2px); }
        .stat-icon {
          width: 50px;
          height: 50px;
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          color: white;
        }
        .stat-icon.blue   { background: #3b82f6; }
        .stat-icon.cyan   { background: #06b6d4; }
        .stat-icon.green  { background: #10b981; }
        .stat-icon.purple { background: #8b5cf6; }
        .stat-info h3 {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--color-text);
        }
        .stat-info p { color: var(--color-text-muted); font-size: 0.875rem; }
        .recent-section, .quick-actions-section {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 1rem;
          padding: 1.5rem;
          margin-bottom: 2rem;
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        .section-header h2 { font-size: 1.25rem; color: var(--color-text); }
        .view-all { color: var(--color-primary); text-decoration: none; font-size: 0.875rem; }
        .recent-jobs-list { display: flex; flex-direction: column; gap: 1rem; }
        .recent-job-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: var(--color-bg);
          border-radius: 0.75rem;
          text-decoration: none;
          transition: all 0.2s;
        }
        .recent-job-item:hover { background: var(--color-surface-2); transform: translateX(5px); }
        .recent-job-icon {
          width: 48px; height: 48px;
          background: var(--color-primary-light);
          border-radius: 0.5rem;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.25rem; font-weight: 600; color: var(--color-primary);
        }
        .recent-job-info { flex: 1; }
        .recent-job-info h4 { color: var(--color-text); margin-bottom: 0.25rem; }
        .recent-job-info p  { color: var(--color-text-muted); font-size: 0.875rem; }
        .job-type-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          background: #e0f2fe; color: #0891b2;
          border-radius: 1rem; font-size: 0.75rem; font-weight: 500;
        }
        .quick-actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }
        .quick-action-card {
          display: flex; align-items: center; justify-content: center;
          gap: 0.75rem; padding: 1rem;
          background: var(--color-bg);
          border-radius: 0.75rem; text-decoration: none;
          color: var(--color-text); transition: all 0.2s;
          border: 1px solid var(--color-border);
        }
        .quick-action-card:hover {
          background: var(--color-primary); color: white; transform: translateY(-2px);
        }
        .quick-action-card i { font-size: 1.25rem; }
      `}</style>
    </div>
  );
}