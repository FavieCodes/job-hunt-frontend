import api from './api';

export interface Scholarship {
  id: string;
  title: string;
  provider: string;
  description: string;
  country: string;
  field: string;
  deadline: string;
  amount: string;
  apply_url: string;
  source_url: string;
  posted_at: string;
  scraped_at: string;
  is_active: boolean;
}

export interface ScholarshipFilters {
  country?: string;
  field?: string;
  page?: number;
  limit?: number;
}

export interface ScholarshipSearchResponse {
  scholarships: Scholarship[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export const scholarshipsAPI = {
  // Search scholarships with filters
  searchScholarships: async (filters: ScholarshipFilters = {}): Promise<ScholarshipSearchResponse> => {
    const params = new URLSearchParams();
    if (filters.country) params.append('country', filters.country);
    if (filters.field) params.append('field', filters.field);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    
    const { data } = await api.get<ScholarshipSearchResponse>(`/scholarships?${params.toString()}`);
    return data;
  },

  // Get single scholarship by ID
  getScholarshipById: async (id: string): Promise<Scholarship> => {
    const { data } = await api.get<Scholarship>(`/scholarships/${id}`);
    return data;
  },

  // Get scholarship statistics
  getScholarshipStats: async (): Promise<{ total: number; active: number }> => {
    const { data } = await api.get('/scholarships/stats');
    return data;
  },
};

// Admin Scholarships API (requires admin role)
export const adminScholarshipsAPI = {
  // Get all scholarships with pagination (admin only)
  getAllScholarships: async (filters?: { page?: number; limit?: number; is_active?: boolean; search?: string }) => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString());
    if (filters?.search) params.append('search', filters.search);
    
    const { data } = await api.get(`/admin/scholarships?${params.toString()}`);
    return data;
  },

  // Create a new scholarship (admin only)
  createScholarship: async (scholarshipData: Partial<Scholarship>): Promise<Scholarship> => {
    const { data } = await api.post<Scholarship>('/admin/scholarships', scholarshipData);
    return data;
  },

  // Update a scholarship (admin only)
  updateScholarship: async (id: string, updates: Partial<Scholarship>): Promise<Scholarship> => {
    const { data } = await api.patch<Scholarship>(`/admin/scholarships/${id}`, updates);
    return data;
  },

  // Delete a scholarship (admin only)
  deleteScholarship: async (id: string): Promise<{ message: string }> => {
    const { data } = await api.delete(`/admin/scholarships/${id}`);
    return data;
  },
};