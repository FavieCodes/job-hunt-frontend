import api from './api';
import { User } from './user';
import { Job } from './jobs';
import { Scholarship } from './scholarships';

export interface AdminUser extends User {
  // Extended user info for admin
}

export const adminAPI = {
  // Get all users (admin only)
  getAllUsers: async (filters?: { search?: string; role?: string }): Promise<AdminUser[]> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.role) params.append('role', filters.role);
    
    const { data } = await api.get<AdminUser[]>(`/admin/users?${params.toString()}`);
    return data;
  },

  // Update user role (admin only)
  updateUserRole: async (userId: string, role: 'user' | 'admin'): Promise<User> => {
    const { data } = await api.patch<User>(`/admin/users/${userId}/role`, { role });
    return data;
  },

  // Delete user (admin only)
  deleteUser: async (userId: string): Promise<{ message: string }> => {
    const { data } = await api.delete(`/admin/users/${userId}`);
    return data;
  },

  // Get system statistics (admin only)
  getSystemStats: async (): Promise<{
    totalUsers: number;
    totalJobs: number;
    totalScholarships: number;
    activeApplications: number;
  }> => {
    const { data } = await api.get('/admin/stats');
    return data;
  },
};