import Cookies from 'js-cookie';
import api from './api';
import { User } from './user';

// Save token 
export function saveSession(token: string, user: User) {
  Cookies.set('token', token, { expires: 7, secure: true, sameSite: 'strict' });
  Cookies.set('user', JSON.stringify(user), { expires: 7 });
}

export function getUser(): User | null {
  const raw = Cookies.get('user');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function isAuthenticated(): boolean {
  return !!Cookies.get('token');
}

export function logout() {
  Cookies.remove('token');
  Cookies.remove('user');
}

// ─── API calls ────────────────────────────────────────────────

export async function signup(email: string, username: string, password: string) {
  const { data } = await api.post('/auth/signup', { email, username, password });
  return data;
}

export async function login(email: string, password: string) {
  const { data } = await api.post('/auth/login', { email, password });
  return data; 
}

export async function googleLogin(idToken: string) {
  const { data } = await api.post('/auth/google', { idToken });
  return data;
}

export async function forgotPassword(email: string) {
  const { data } = await api.post('/auth/forgot-password', { email });
  return data;
}

export async function resetPasswordWithToken(
  token: string, newPassword: string, confirmNewPassword: string
) {
  const { data } = await api.post('/auth/reset-password/token', {
    token, newPassword, confirmNewPassword,
  });
  return data;
}

export async function changePassword(
  oldPassword: string, newPassword: string, confirmNewPassword: string
) {
  const { data } = await api.post('/auth/reset-password', {
    oldPassword, newPassword, confirmNewPassword,
  });
  return data;
}

export async function confirmEmail(token: string) {
  const { data } = await api.get(`/auth/confirm?token=${token}`);
  return data;
}

export async function resendConfirmation(email: string) {
  const { data } = await api.post('/auth/resend-confirmation', { email });
  return data;
}

export async function getMe() {
  const { data } = await api.get('/auth/me');
  return data;
}