export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-layout">
      <div className="auth-panel-left">
        <div className="brand">Job<span>Hunt</span></div>
        <div className="tagline">
          <h2>Your next opportunity starts here.</h2>
          <p>Search thousands of jobs and scholarships from top companies and institutions worldwide.</p>
        </div>
      </div>
      <div className="auth-panel-right">{children}</div>
    </div>
  );
}