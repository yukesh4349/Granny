// ============================================================================
// API Service — Typed HTTP client for all backend calls
// ============================================================================

import { databaseService } from './supabase';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const AI_BASE = import.meta.env.VITE_AI_URL || 'http://localhost:8000';

/** Get stored auth token */
function getToken(): string | null {
  return localStorage.getItem('granny_token');
}

/** Make authenticated API request */
async function request<T>(
  path: string,
  options: RequestInit = {},
  base: string = API_BASE
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const res = await fetch(`${base}${path}`, { ...options, headers });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  return res.json();
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { name: string; phone?: string; email?: string; password?: string; role?: string; language?: string }) =>
    request<any>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { phone?: string; email?: string; password?: string; otp?: string }) =>
    request<any>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  requestOtp: (phone: string) =>
    request<any>('/auth/request-otp', { method: 'POST', body: JSON.stringify({ phone }) }),

  refresh: (refreshToken: string) =>
    request<any>('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) }),
};

// ─── Users ────────────────────────────────────────────────────────────────────
export const usersApi = {
  getMe: () => request<any>('/users/me'),
  updateMe: (data: any) => request<any>('/users/me', { method: 'PUT', body: JSON.stringify(data) }),
  updateProfile: (data: any) => request<any>('/users/me/profile', { method: 'PUT', body: JSON.stringify(data) }),
};

// ─── Memory ───────────────────────────────────────────────────────────────────
export const memoryApi = {
  getAll: (limit?: number) => request<any[]>(`/memory?limit=${limit || 50}`),
  create: (data: { type: string; title?: string; content: string; tags?: string[] }) =>
    request<any>('/memory', { method: 'POST', body: JSON.stringify(data) }),
  search: (query: string) =>
    request<any>('/memory/search', { method: 'POST', body: JSON.stringify({ query }) }),
  delete: (id: string) => request<any>(`/memory/${id}`, { method: 'DELETE' }),
};

// ─── Games ────────────────────────────────────────────────────────────────────
export const gamesApi = {
  getCatalog: () => request<any[]>('/games/catalog'),
  startSession: (gameKey: string) =>
    request<any>('/games/session/start', { method: 'POST', body: JSON.stringify({ gameKey }) }),
  submitAttempt: async (data: any) => {
    try {
      return await databaseService.submitGameAttempt(data);
    } catch {
      return { success: true, local: true };
    }
  },
  endSession: (sessionId: string, score?: number) =>
    request<any>('/games/session/end', { method: 'POST', body: JSON.stringify({ sessionId, score }) }),
  getSessions: (gameKey?: string) =>
    request<any[]>(`/games/sessions${gameKey ? `?gameKey=${gameKey}` : ''}`),
};

// ─── Conversations ────────────────────────────────────────────────────────────
export const conversationApi = {
  send: (text: string, conversationId?: string) =>
    request<any>('/conversations/message', {
      method: 'POST',
      body: JSON.stringify({ text, conversationId }),
    }),
  getAll: () => request<any[]>('/conversations'),
  getById: (id: string) => request<any>(`/conversations/${id}`),
};

// ─── AI Direct (for voice) ────────────────────────────────────────────────────
export const aiApi = {
  converse: (data: { userId: string; text: string; sessionHistory?: any[] }) =>
    request<any>('/converse', { method: 'POST', body: JSON.stringify(data) }, AI_BASE),
  analyzEmotion: (text: string) =>
    request<any>('/emotion/analyze', { method: 'POST', body: JSON.stringify({ text }) }, AI_BASE),
};

// ─── Reminders ────────────────────────────────────────────────────────────────
export const remindersApi = {
  getAll: () => request<any[]>('/reminders'),
  getToday: () => request<any[]>('/reminders/today'),
  create: (data: { type: string; title: string; description?: string; scheduleCron?: string; timeOfDay?: string }) =>
    request<any>('/reminders', { method: 'POST', body: JSON.stringify(data) }),
  confirm: (id: string) => request<any>(`/reminders/${id}/confirm`, { method: 'POST' }),
  delete: (id: string) => request<any>(`/reminders/${id}`, { method: 'DELETE' }),
};

// ─── Family Dashboard ─────────────────────────────────────────────────────────
export const familyApi = {
  getDashboard: (elderId: string) => request<any>(`/family/dashboard/${elderId}`),
  getAdherence: (elderId: string) => request<any>(`/family/adherence/${elderId}`),
  getMoodTrend: (elderId: string) => request<any>(`/family/mood/${elderId}`),
  getGamePerformance: (elderId: string) => request<any>(`/family/games/${elderId}`),
};

// ─── Health & Medical Records ─────────────────────────────────────────────────
export const healthApi = {
  getReports: (elderId: string) => request<any[]>(`/health/reports?elderId=${elderId}`),
  getReportById: (id: string) => request<any>(`/health/reports/${id}`),
  createReport: (data: any) => request<any>('/health/reports', { method: 'POST', body: JSON.stringify(data) }),
  updateReport: (id: string, data: any) => request<any>(`/health/reports/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteReport: (id: string) => request<any>(`/health/reports/${id}`, { method: 'DELETE' }),
  getCareNotes: (elderId: string) => request<any[]>(`/health/notes?elderId=${elderId}`),
  createCareNote: (data: any) => request<any>('/health/notes', { method: 'POST', body: JSON.stringify(data) }),
};

// ─── Caretaker Notifications & Alarms ─────────────────────────────────────────
export const notificationsApi = {
  getNotifications: (elderId?: string) => request<any[]>(`/notifications${elderId ? `?elderId=${elderId}` : ''}`),
  createNotification: (data: any) => request<any>('/notifications', { method: 'POST', body: JSON.stringify(data) }),
  markAsRead: (id: string) => request<any>(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllAsRead: (elderId?: string) => request<any>(`/notifications/read-all${elderId ? `?elderId=${elderId}` : ''}`, { method: 'POST' }),
  clearNotifications: (elderId?: string) => request<any>(`/notifications/clear${elderId ? `?elderId=${elderId}` : ''}`, { method: 'DELETE' }),
};

// ─── Personalization ─────────────────────────────────────────────────────────
export const personalizationApi = {
  getPreferences: (userId: string) => request<any>(`/personalization/${userId}`),
  updatePreferences: (userId: string, data: any) => request<any>(`/personalization/${userId}`, { method: 'PUT', body: JSON.stringify(data) }),
};
