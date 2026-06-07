export interface Question {
  question: string;
  tip: string;
}

export interface Video {
  title: string;
  url: string;
}

export interface PrepResult {
  id: string;
  job_role: string;
  interview_type: string;
  questions: Question[];
  videos: Video[];
  created_at: string;
}

export const FIELDS = [
  { label: 'Software Engineering',     icon: 'fa-code' },
  { label: 'Data Science & Analytics', icon: 'fa-chart-bar' },
  { label: 'Product Management',       icon: 'fa-layer-group' },
  { label: 'UI/UX Design',             icon: 'fa-paint-brush' },
  { label: 'DevOps & Cloud',           icon: 'fa-server' },
  { label: 'Cybersecurity',            icon: 'fa-shield-alt' },
  { label: 'Marketing',                icon: 'fa-bullhorn' },
  { label: 'Finance & Accounting',     icon: 'fa-coins' },
  { label: 'Human Resources',          icon: 'fa-users' },
  { label: 'Sales',                    icon: 'fa-handshake' },
  { label: 'Healthcare',               icon: 'fa-heartbeat' },
  { label: 'Legal',                    icon: 'fa-gavel' },
  { label: 'Custom…',                  icon: 'fa-edit' },
];

export const INTERVIEW_TYPES = [
  { value: 'Technical',        label: 'Technical',        icon: 'fa-laptop-code',   desc: 'Coding, algorithms & system design' },
  { value: 'Behavioral',       label: 'Behavioral',       icon: 'fa-comments',       desc: 'Soft skills & past experience' },
  { value: 'Case Study',       label: 'Case Study',       icon: 'fa-briefcase',      desc: 'Problem-solving & business cases' },
  { value: 'HR / Culture Fit', label: 'HR / Culture Fit', icon: 'fa-user-check',     desc: 'Values, culture & motivation' },
  { value: 'Portfolio Review', label: 'Portfolio Review', icon: 'fa-folder-open',    desc: 'Presenting your previous work' },
];