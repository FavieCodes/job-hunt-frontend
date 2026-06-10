export default function Loading() {
  return (
    <div className="page-loader">
      <div className="loader-content">
        <div className="loader-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring spinner-ring-2"></div>
          <div className="spinner-core">
            <i className="fas fa-briefcase"></i>
          </div>
        </div>
        <p className="loader-text">Loading…</p>
      </div>

      <style>{`
        .page-loader {
          position: fixed;
          inset: 0;
          background: var(--color-bg, #f7f6f3);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: loaderFadeIn .15s ease;
        }
        @keyframes loaderFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .loader-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.25rem;
        }
        .loader-spinner {
          position: relative;
          width: 72px;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .spinner-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 3px solid transparent;
          border-top-color: #06b6d4;
          animation: spin .9s linear infinite;
        }
        .spinner-ring-2 {
          inset: 8px;
          border-top-color: #1e3a8a;
          animation-duration: 1.3s;
          animation-direction: reverse;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spinner-core {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: linear-gradient(135deg, #06b6d4, #1e3a8a);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1rem;
          box-shadow: 0 4px 16px rgba(6,182,212,.35);
        }
        .loader-text {
          font-size: .875rem;
          font-weight: 600;
          color: var(--color-text-muted, #6b6860);
          letter-spacing: .05em;
          animation: pulse 1.5s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: .4; }
        }
      `}</style>
    </div>
  );
}