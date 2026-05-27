import api from './api';

export interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  country: string;
  state: string;
  city: string;
  job_type: string;
  salary: string;
  apply_url: string;
  source_url: string;
  source_name: string;
  posted_at: string;
  scraped_at: string;
  is_active: boolean;
}

export interface JobFilters {
  country?: string;
  state?: string;
  city?: string;
  q?: string;
  job_type?: string;
  page?: number;
  limit?: number;
}

export interface JobSearchResponse {
  jobs: Job[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export const jobsAPI = {
  // Search jobs with filters
  searchJobs: async (filters: JobFilters = {}): Promise<JobSearchResponse> => {
    const params = new URLSearchParams();
    if (filters.country) params.append('country', filters.country);
    if (filters.state) params.append('state', filters.state);
    if (filters.city) params.append('city', filters.city);
    if (filters.q) params.append('q', filters.q);
    if (filters.job_type) params.append('job_type', filters.job_type);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    
    const { data } = await api.get<JobSearchResponse>(`/jobs?${params.toString()}`);
    return data;
  },

  // Get single job by ID
  getJobById: async (id: string): Promise<Job> => {
    const { data } = await api.get<Job>(`/jobs/${id}`);
    return data;
  },

  // Get job statistics
  getJobStats: async (): Promise<{ total: number; active: number }> => {
    const { data } = await api.get('/jobs/stats');
    return data;
  },
};

// Admin Jobs API (requires admin role)
export const adminJobsAPI = {
  // Get all jobs with pagination (admin only)
  getAllJobs: async (filters?: { page?: number; limit?: number; is_active?: boolean; search?: string }) => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString());
    if (filters?.search) params.append('search', filters.search);
    
    const { data } = await api.get(`/admin/jobs?${params.toString()}`);
    return data;
  },

  // Create a new job (admin only)
  createJob: async (jobData: Partial<Job>): Promise<Job> => {
    const { data } = await api.post<Job>('/admin/jobs', jobData);
    return data;
  },

  // Create multiple jobs (admin only)
  createMultipleJobs: async (jobsData: Partial<Job>[]): Promise<{ created: number; skipped: number; errors: any[] }> => {
    const { data } = await api.post('/admin/jobs', jobsData);
    return data;
  },

  // Update a job (admin only)
  updateJob: async (id: string, updates: Partial<Job>): Promise<Job> => {
    const { data } = await api.patch<Job>(`/admin/jobs/${id}`, updates);
    return data;
  },

  // Delete a job (admin only)
  deleteJob: async (id: string): Promise<{ message: string }> => {
    const { data } = await api.delete(`/admin/jobs/${id}`);
    return data;
  },
};