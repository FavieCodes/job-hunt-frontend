import api from './api';

export type AppStatus = 'pending' | 'reviewed' | 'accepted' | 'rejected' | 'withdrawn';
export type AppType = 'job' | 'scholarship' | 'manual';

export interface Application {
  id: string;
  job_id?: string;
  scholarship_id?: string;
  application_type: AppType;
  status: AppStatus;
  title: string;
  company: string;
  location: string;
  job_type?: string;
  salary?: string;
  apply_url?: string;
  deadline?: string;
  amount?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  manual_title?: string;
  manual_company?: string;
  manual_location?: string;
  manual_job_type?: string;
  manual_apply_url?: string;
  manual_notes?: string;
}

export interface ApplicationStats {
  total: number;
  pending: number;
  reviewed: number;
  accepted: number;
  rejected: number;
}

export const STATUS_CONFIG: Record<AppStatus, { label: string; bg: string; text: string }> = {
  pending:   { label: 'Pending',   bg: '#fef3c7', text: '#92400e' },
  reviewed:  { label: 'Reviewed',  bg: '#dbeafe', text: '#1e40af' },
  accepted:  { label: 'Accepted',  bg: '#d1fae5', text: '#065f46' },
  rejected:  { label: 'Rejected',  bg: '#fee2e2', text: '#7f1d1d' },
  withdrawn: { label: 'Withdrawn', bg: '#f3f4f6', text: '#374151' },
};

export const TYPE_CONFIG: Record<AppType, { label: string; icon: string; color: string }> = {
  job:         { label: 'Job',         icon: 'fa-briefcase',        color: '#1e40af' },
  scholarship: { label: 'Scholarship', icon: 'fa-graduation-cap',   color: '#6d28d9' },
  manual:      { label: 'External',    icon: 'fa-external-link-alt', color: '#065f46' },
};

export const EMPTY_MANUAL = {
  title: '',
  company: '',
  apply_url: '',
  location: '',
  job_type: '',
  notes: '',
};

export const applicationsAPI = {
  getApplications: async (): Promise<Application[]> => {
    const { data } = await api.get<Application[]>('/user/applications');
    return data;
  },

  addManualApplication: async (payload: {
    title: string;
    company: string;
    apply_url?: string;
    location?: string;
    job_type?: string;
    notes?: string;
  }): Promise<Application> => {
    const { data } = await api.post<Application>('/user/applications/manual', payload);
    return data;
  },

  updateApplicationStatus: async (
    applicationId: string,
    status: AppStatus
  ): Promise<Application> => {
    const { data } = await api.patch<Application>(`/user/applications/${applicationId}/status`, {
      status,
    });
    return data;
  },

  getApplicationStats: async (): Promise<ApplicationStats> => {
    const { data } = await api.get<ApplicationStats>('/user/stats');
    return data;
  },

  applyForScholarship: async (scholarshipId: string): Promise<Application> => {
  const { data } = await api.post<Application>('/user/applications', {
    scholarship_id: scholarshipId,
  });
  return data;
},

applyForJob: async (jobId: string): Promise<Application> => {
  const { data } = await api.post<Application>('/user/applications', { job_id: jobId });
  return data;
},



};

