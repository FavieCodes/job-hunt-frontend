import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request automatically
api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — log user out if token expires
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('token');
      Cookies.remove('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;