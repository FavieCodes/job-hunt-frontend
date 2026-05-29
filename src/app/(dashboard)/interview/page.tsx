'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Question {
  question: string;
  tip: string;
}

interface Video {
  title: string;
  url: string;
}

interface PrepResult {
  id: string;
  job_role: string;
  interview_type: string;
  questions: Question[];
  videos: Video[];
  created_at: string;
}

const JOB_FIELDS = [
  'Software Engineering',
  'Frontend Development',
  'Backend Development',
  'Full Stack Development',
  'Data Science',
  'Machine Learning / AI',
  'DevOps / SRE',
  'Product Management',
  'UX / UI Design',
  'Cybersecurity',
  'Cloud Engineering',
  'Mobile Development',
  'Data Engineering',
  'QA / Test Engineering',
  'Business Analysis',
  'Project Management',
  'Marketing',
  'Finance / Accounting',
  'Human Resources',
  'Sales',
  'Customer Success',
  'Other (custom)',
];

const INTERVIEW_TYPES = [
  { value: 'technical', label: 'Technical', icon: 'fa-code' },
  { value: 'behavioral', label: 'Behavioral', icon: 'fa-comments' },
  { value: 'system design', label: 'System Design', icon: 'fa-project-diagram' },
  { value: 'case study', label: 'Case Study', icon: 'fa-briefcase' },
  { value: 'hr/cultural fit', label: 'HR / Culture Fit', icon: 'fa-handshake' },
];

export default function InterviewPrepPage() {
  const [jobRole, setJobRole] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [interviewType, setInterviewType] = useState('technical');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PrepResult | null>(null);
  const [history, setHistory] = useState<PrepResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedQ, setExpandedQ] = useState<number | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data } = await api.get('/interview/history');
      setHistory(data || []);
    } catch {
      // history is optional
    }
  };

  const handleGenerate = async () => {
    const role = jobRole === 'Other (custom)' ? customRole.trim() : jobRole;
    if (!role) {
      toast.error('Please select or enter a job field');
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const { data } = await api.post('/interview/generate', {
        jobRole: role,
        interviewType,
      });
      // Questions and videos may be stored as JSON strings
      const parsed = {
        ...data,
        questions: typeof data.questions === 'string' ? JSON.parse(data.questions) : data.questions,
        videos:    typeof data.videos    === 'string' ? JSON.parse(data.videos)    : data.videos,
      };
      setResult(parsed);
      fetchHistory();
      toast.success('Interview prep generated!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to generate prep. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadFromHistory = (item: PrepResult) => {
    const parsed = {
      ...item,
      questions: typeof item.questions === 'string' ? JSON.parse(item.questions) : item.questions,
      videos:    typeof item.videos    === 'string' ? JSON.parse(item.videos)    : item.videos,
    };
    setResult(parsed);
    setShowHistory(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="page-header">
        <h1><i className="fas fa-comments"></i> Interview Prep</h1>
        <p>Get AI-generated practice questions and video resources tailored to your target role</p>
      </div>

      {/* Config card */}
      <div className="config-card">
        <h2 className="config-title">
          <i className="fas fa-sliders-h"></i> Customize Your Prep
        </h2>

        {/* Job field selector */}
        <div className="field-group">
          <label className="field-label">
            <i className="fas fa-briefcase"></i> Job Field / Role
          </label>
          <div className="fields-grid">
            {JOB_FIELDS.map((field) => (
              <button
                key={field}
                onClick={() => setJobRole(field)}
                className={`field-chip ${jobRole === field ? 'selected' : ''}`}
              >
                {field}
              </button>
            ))}
          </div>
          {jobRole === 'Other (custom)' && (
            <input
              type="text"
              placeholder="Enter your job role e.g. Blockchain Developer"
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              className="custom-input"
            />
          )}
        </div>

        {/* Interview type */}
        <div className="field-group">
          <label className="field-label">
            <i className="fas fa-clipboard-list"></i> Interview Type
          </label>
          <div className="type-row">
            {INTERVIEW_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setInterviewType(t.value)}
                className={`type-btn ${interviewType === t.value ? 'selected' : ''}`}
              >
                <i className={`fas ${t.icon}`}></i>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="action-row">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="generate-btn"
          >
            {loading ? (
              <><i className="fas fa-spinner fa-spin"></i> Generating…</>
            ) : (
              <><i className="fas fa-magic"></i> Generate Prep</>
            )}
          </button>
          {history.length > 0 && (
            <button onClick={() => setShowHistory(!showHistory)} className="history-btn">
              <i className="fas fa-history"></i> History ({history.length})
            </button>
          )}
        </div>
      </div>

      {/* History panel */}
      {showHistory && history.length > 0 && (
        <div className="history-panel">
          <h3 className="history-title"><i className="fas fa-history"></i> Previous Sessions</h3>
          <div className="history-list">
            {history.map((item) => (
              <button key={item.id} onClick={() => loadFromHistory(item)} className="history-item">
                <div>
                  <strong>{item.job_role}</strong>
                  <span className="history-type">{item.interview_type}</span>
                </div>
                <span className="history-date">
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="result-card">
          <div className="skeleton-heading"></div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton-question">
              <div className="skeleton-line wide"></div>
              <div className="skeleton-line narrow"></div>
            </div>
          ))}
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="result-card">
          <div className="result-header">
            <div>
              <h2 className="result-title">
                <i className="fas fa-check-circle"></i> {result.job_role}
              </h2>
              <span className="result-type-badge">{result.interview_type} interview</span>
            </div>
            <button onClick={handleGenerate} className="regen-btn">
              <i className="fas fa-redo"></i> Regenerate
            </button>
          </div>

          {/* Questions */}
          <section className="section">
            <h3 className="section-title">
              <i className="fas fa-question-circle"></i> Practice Questions
            </h3>
            <div className="questions-list">
              {result.questions?.map((q, i) => (
                <div
                  key={i}
                  className={`question-item ${expandedQ === i ? 'open' : ''}`}
                  onClick={() => setExpandedQ(expandedQ === i ? null : i)}
                >
                  <div className="question-header">
                    <span className="q-number">{i + 1}</span>
                    <p className="q-text">{q.question}</p>
                    <i className={`fas fa-chevron-${expandedQ === i ? 'up' : 'down'} q-chevron`}></i>
                  </div>
                  {expandedQ === i && (
                    <div className="tip-box">
                      <i className="fas fa-lightbulb"></i>
                      <p>{q.tip}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Videos */}
          {result.videos && result.videos.length > 0 && (
            <section className="section">
              <h3 className="section-title">
                <i className="fab fa-youtube"></i> Recommended Resources
              </h3>
              <div className="videos-list">
                {result.videos.map((v, i) => (
                  <a
                    key={i}
                    href={v.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="video-item"
                  >
                    <div className="video-icon">
                      <i className="fab fa-youtube"></i>
                    </div>
                    <div className="video-info">
                      <p className="video-title">{v.title}</p>
                      <span className="video-link">Search on YouTube →</span>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <style jsx>{`
        .page-header { margin-bottom: 2rem; }
        .page-header h1 { font-size: 2rem; color: var(--color-text); margin-bottom: 0.5rem; }
        .page-header p  { color: var(--color-text-muted); }

        /* Config card */
        .config-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 1rem;
          padding: 2rem;
          margin-bottom: 1.5rem;
        }
        .config-title {
          font-size: 1.2rem;
          color: var(--color-text);
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .field-group { margin-bottom: 1.5rem; }
        .field-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          color: var(--color-text);
          margin-bottom: 0.75rem;
          font-size: 0.95rem;
        }
        .fields-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .field-chip {
          padding: 0.4rem 0.9rem;
          border: 1.5px solid var(--color-border);
          border-radius: 2rem;
          background: var(--color-bg);
          color: var(--color-text);
          cursor: pointer;
          font-size: 0.85rem;
          transition: all 0.2s;
        }
        .field-chip:hover  { border-color: #06b6d4; color: #06b6d4; }
        .field-chip.selected {
          background: #06b6d4;
          border-color: #06b6d4;
          color: white;
          font-weight: 600;
        }
        .custom-input {
          width: 100%;
          margin-top: 0.75rem;
          padding: 0.65rem 1rem;
          border: 1.5px solid #06b6d4;
          border-radius: 0.5rem;
          background: var(--color-bg);
          color: var(--color-text);
          font-size: 0.95rem;
          outline: none;
        }
        .type-row { display: flex; flex-wrap: wrap; gap: 0.75rem; }
        .type-btn {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.55rem 1rem;
          border: 1.5px solid var(--color-border);
          border-radius: 0.5rem;
          background: var(--color-bg);
          color: var(--color-text);
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.2s;
        }
        .type-btn:hover { border-color: #06b6d4; }
        .type-btn.selected {
          background: linear-gradient(135deg, #06b6d4, #1e3a8a);
          border-color: transparent;
          color: white;
          font-weight: 600;
        }
        .action-row { display: flex; gap: 1rem; margin-top: 1.5rem; flex-wrap: wrap; }
        .generate-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.75rem;
          background: linear-gradient(135deg, #06b6d4, #1e3a8a);
          color: white;
          border: none;
          border-radius: 0.75rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .generate-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .history-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          background: var(--color-bg);
          border: 1.5px solid var(--color-border);
          border-radius: 0.75rem;
          color: var(--color-text);
          font-size: 0.9rem;
          cursor: pointer;
        }

        /* History panel */
        .history-panel {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 1rem;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .history-title { font-size: 1rem; margin-bottom: 1rem; color: var(--color-text); }
        .history-list  { display: flex; flex-direction: column; gap: 0.5rem; }
        .history-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: 0.5rem;
          cursor: pointer;
          text-align: left;
          width: 100%;
          transition: background 0.2s;
        }
        .history-item:hover { background: var(--color-surface-2); }
        .history-type {
          display: inline-block;
          margin-left: 0.5rem;
          padding: 0.15rem 0.5rem;
          background: #e0f2fe;
          color: #0891b2;
          border-radius: 1rem;
          font-size: 0.75rem;
        }
        .history-date { font-size: 0.8rem; color: var(--color-text-muted); }

        /* Skeleton */
        .result-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 1rem;
          padding: 2rem;
          margin-bottom: 2rem;
        }
        .skeleton-heading {
          height: 1.5rem; background: var(--color-border);
          border-radius: 0.5rem; margin-bottom: 1.5rem; width: 60%;
          animation: pulse 1.5s infinite;
        }
        .skeleton-question {
          padding: 1rem;
          border: 1px solid var(--color-border);
          border-radius: 0.5rem;
          margin-bottom: 0.75rem;
        }
        .skeleton-line {
          height: 0.875rem;
          background: var(--color-border);
          border-radius: 0.25rem;
          margin-bottom: 0.5rem;
          animation: pulse 1.5s infinite;
        }
        .skeleton-line.wide  { width: 90%; }
        .skeleton-line.narrow { width: 60%; }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }

        /* Result */
        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .result-title {
          font-size: 1.4rem;
          color: var(--color-text);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .result-title i { color: #10b981; }
        .result-type-badge {
          display: inline-block;
          margin-top: 0.25rem;
          padding: 0.25rem 0.75rem;
          background: #e0f2fe;
          color: #0891b2;
          border-radius: 1rem;
          font-size: 0.8rem;
          font-weight: 500;
          text-transform: capitalize;
        }
        .regen-btn {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 1rem;
          border: 1.5px solid var(--color-border);
          border-radius: 0.5rem;
          background: var(--color-bg);
          color: var(--color-text);
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.2s;
        }
        .regen-btn:hover { border-color: #06b6d4; color: #06b6d4; }

        .section { margin-bottom: 2rem; }
        .section-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--color-text);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid var(--color-border);
        }

        .questions-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .question-item {
          border: 1.5px solid var(--color-border);
          border-radius: 0.75rem;
          overflow: hidden;
          cursor: pointer;
          transition: border-color 0.2s;
        }
        .question-item:hover  { border-color: #06b6d4; }
        .question-item.open   { border-color: #06b6d4; }
        .question-header {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1rem 1.25rem;
          background: var(--color-bg);
        }
        .q-number {
          flex-shrink: 0;
          width: 28px;
          height: 28px;
          background: #06b6d4;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          font-weight: 700;
        }
        .q-text  { flex: 1; color: var(--color-text); font-size: 0.95rem; line-height: 1.5; margin: 0; }
        .q-chevron { color: var(--color-text-muted); margin-left: auto; flex-shrink: 0; margin-top: 0.25rem; }
        .tip-box {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          background: #f0fdf4;
          border-top: 1px solid #d1fae5;
        }
        .tip-box i { color: #10b981; flex-shrink: 0; margin-top: 0.2rem; }
        .tip-box p { color: #065f46; font-size: 0.875rem; line-height: 1.6; margin: 0; }

        .videos-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .video-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.25rem;
          background: var(--color-bg);
          border: 1.5px solid var(--color-border);
          border-radius: 0.75rem;
          text-decoration: none;
          transition: all 0.2s;
        }
        .video-item:hover { border-color: #ef4444; transform: translateX(4px); }
        .video-icon {
          width: 44px; height: 44px;
          background: #fee2e2;
          border-radius: 0.5rem;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.4rem; color: #ef4444; flex-shrink: 0;
        }
        .video-title { color: var(--color-text); font-weight: 600; font-size: 0.9rem; margin-bottom: 0.2rem; }
        .video-link  { color: #06b6d4; font-size: 0.8rem; }
      `}</style>
    </div>
  );
}