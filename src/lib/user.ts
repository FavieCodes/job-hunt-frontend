import api from './api';
import { Job } from './jobs';

export interface User {
  id: string;
  email: string;
  username: string;
  role: 'user' | 'admin';
  is_confirmed: boolean;
  created_at: string;
  avatar: string | null;
}

export interface Application {
  id: string;
  job_id: string;
  scholarship_id?: string;
  application_type?: 'job' | 'scholarship' | 'manual';
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected' | 'withdrawn';
  created_at: string;
 
  title?: string;
  company?: string;
  country?: string;
  state?: string;
  city?: string;
  job_type?: string;
  salary?: string;
  apply_url?: string;
  posted_at?: string;
  job?: Job;
}

export interface ApplicationStats {
  total: number;
  pending: number;
  reviewed: number;
  accepted: number;
  rejected: number;
}

export type ItemType = 'job' | 'scholarship';

export interface SavedItem {
  id: string;
  title: string;
  company?: string;
  job_type?: string;
  city?: string;
  state?: string;
  country?: string;
  salary?: string;
  apply_url?: string;
  description?: string;
  provider?: string;
  field?: string;
  deadline?: string;
  amount?: string;
  saved_at: string;
  item_type: ItemType;
}

export const userAPI = {
  getProfile: async (): Promise<User> => {
    const { data } = await api.get<User>('/user/profile');
    return data;
  },

  updateProfile: async (updates: { username?: string; avatar?: string }): Promise<User> => {
    const { data } = await api.patch<User>('/user/profile', updates);
    return data;
  },

  // ── Applications ────────────────────────────────────────────────────────────

  getApplications: async (): Promise<Application[]> => {
    const { data } = await api.get<Application[]>('/user/applications');
    return data;
  },

  applyForJob: async (jobId: string): Promise<Application> => {
    const { data } = await api.post<Application>('/user/applications', { job_id: jobId });
    return data;
  },

  applyForScholarship: async (scholarshipId: string): Promise<Application> => {
    const { data } = await api.post<Application>('/user/applications', {
      scholarship_id: scholarshipId,
    });
    return data;
  },

  /** Add a manual application */
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

  /** Update application status */
  updateApplicationStatus: async (
    applicationId: string,
    status: Application['status']
  ): Promise<Application> => {
    const { data } = await api.patch<Application>(`/user/applications/${applicationId}/status`, {
      status,
    });
    return data;
  },

  // ── Saved Jobs ──────────────────────────────────────────────────────────────

  getSavedJobs: async (): Promise<Job[]> => {
    const { data } = await api.get<Job[]>('/user/saved/jobs');
    return data;
  },

  saveJob: async (jobId: string): Promise<{ message: string }> => {
    const { data } = await api.post('/user/saved/jobs', { job_id: jobId });
    return data;
  },

  removeSavedJob: async (jobId: string): Promise<{ message: string }> => {
    const { data } = await api.delete(`/user/saved/jobs/${jobId}`);
    return data;
  },

  // ── Saved ScholarshipsI ──────────────

  getSavedScholarships: async (): Promise<any[]> => {
    const { data } = await api.get('/user/saved/scholarships');
    return data;
  },

  saveScholarship: async (scholarshipId: string): Promise<{ message: string }> => {
    const { data } = await api.post('/user/saved/scholarships', {
      scholarship_id: scholarshipId,
    });
    return data;
  },

  removeSavedScholarship: async (scholarshipId: string): Promise<{ message: string }> => {
    const { data } = await api.delete(`/user/saved/scholarships/${scholarshipId}`);
    return data;
  },

  // ── Stats ────────────────────────────────────────────────────────────────────

  getApplicationStats: async (): Promise<ApplicationStats> => {
    const { data } = await api.get<ApplicationStats>('/user/stats');
    return data;
  },
};