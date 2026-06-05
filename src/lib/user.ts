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

  // ── Saved Scholarships ──────────────────────────────────────────────────────

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
};