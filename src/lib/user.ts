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
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  created_at: string;
  job?: Job;
}

export interface ApplicationStats {
  total: number;
  pending: number;
  reviewed: number;
  accepted: number;
  rejected: number;
}

export const userAPI = {
  // Get user profile
  getProfile: async (): Promise<User> => {
    const { data } = await api.get<User>('/user/profile');
    return data;
  },

  // Update user profile
  updateProfile: async (updates: { username?: string; avatar?: string }): Promise<User> => {
    const { data } = await api.patch<User>('/user/profile', updates);
    return data;
  },

  // Get user applications
  getApplications: async (): Promise<Application[]> => {
    const { data } = await api.get<Application[]>('/user/applications');
    return data;
  },

  // Apply for a job
  applyForJob: async (jobId: string): Promise<Application> => {
    const { data } = await api.post<Application>('/user/applications', { job_id: jobId });
    return data;
  },

  // Get saved jobs
  getSavedJobs: async (): Promise<Job[]> => {
    const { data } = await api.get<Job[]>('/user/saved');
    return data;
  },

  // Save a job
  saveJob: async (jobId: string): Promise<{ message: string }> => {
    const { data } = await api.post('/user/saved', { job_id: jobId });
    return data;
  },

  // Remove saved job
  removeSavedJob: async (jobId: string): Promise<{ message: string }> => {
    const { data } = await api.delete(`/user/saved/${jobId}`);
    return data;
  },

  // Get application statistics
  getApplicationStats: async (): Promise<ApplicationStats> => {
    const { data } = await api.get<ApplicationStats>('/user/stats');
    return data;
  },
};