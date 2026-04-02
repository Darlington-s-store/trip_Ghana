import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (data: { email: string; password: string; firstName: string; lastName: string }) =>
    api.post('/auth/register', data),
  adminLogin: (email: string, password: string) => api.post('/auth/admin/login', { email, password }),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  verifyResetToken: (email: string, code: string) => api.post('/auth/verify-reset-token', { email, code }),
  resetPassword: (data: { email: string; code: string; newPassword: string }) => api.post('/auth/reset-password', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: { firstName: string; lastName: string; phone: string }) => api.put('/auth/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) => api.put('/auth/change-password', data),
};

// Hotels
export const hotelsApi = {
  getAll: (params?: Record<string, string | number | boolean>) => api.get('/hotels', { params }),
  getById: (id: string) => api.get(`/hotels/${id}`),
  create: (data: Record<string, unknown>) => api.post('/hotels', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/hotels/${id}`, data),
  delete: (id: string) => api.delete(`/hotels/${id}`),
};

// Destinations
export const destinationsApi = {
  getAll: (params?: Record<string, string | number | boolean>) => api.get('/destinations', { params }),
  getById: (id: string) => api.get(`/destinations/${id}`),
  getBySlug: (slug: string) => api.get(`/destinations/slug/${slug}`),
  create: (data: Record<string, unknown>) => api.post('/destinations', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/destinations/${id}`, data),
  delete: (id: string) => api.delete(`/destinations/${id}`),
};

// Attractions
export const attractionsApi = {
  getAll: (params?: Record<string, string | number | boolean>) => api.get('/attractions', { params }),
  getById: (id: string) => api.get(`/attractions/${id}`),
  create: (data: Record<string, unknown>) => api.post('/attractions', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/attractions/${id}`, data),
  delete: (id: string) => api.delete(`/attractions/${id}`),
};

// Bookings
export const bookingsApi = {
  getMyBookings: () => api.get('/bookings/my'),
  getAll: (params?: Record<string, string | number | boolean>) => api.get('/bookings', { params }),
  getById: (id: string) => api.get(`/bookings/${id}`),
  create: (data: Record<string, unknown>) => api.post('/bookings', data),
  cancel: (id: string) => api.put(`/bookings/${id}/cancel`),
  updateStatus: (id: string, status: string) => api.put(`/bookings/${id}/status`, { status }),
};

// Trips
export const tripsApi = {
  getAll: (params?: Record<string, string | number | boolean>) => api.get('/trips/all', { params }),
  getMyTrips: () => api.get('/trips/my'),
  getById: (id: string) => api.get(`/trips/${id}`),
  create: (data: Record<string, unknown>) => api.post('/trips', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/trips/${id}`, data),
  submit: (id: string) => api.patch(`/trips/${id}/submit`),
  approve: (id: string) => api.patch(`/trips/${id}/approve`),
  reject: (id: string, reason: string) => api.patch(`/trips/${id}/reject`, { reason }),
  delete: (id: string) => api.delete(`/trips/${id}`),
};

// Notifications
export const notificationsApi = {
  getAll: () => api.get('/notifications'),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

// Admin Users
export const usersApi = {
  getAll: (params?: Record<string, string | number | boolean>) => api.get('/admin/users', { params }),
  getById: (id: string) => api.get(`/admin/users/${id}`),
  create: (data: Record<string, unknown>) => api.post('/admin/users', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/admin/users/${id}`, data),
  delete: (id: string) => api.delete(`/admin/users/${id}`),
};

// Analytics
export const analyticsApi = {
  getOverview: () => api.get('/admin/analytics/overview'),
};

// Settings
export const settingsApi = {
  getAll: () => api.get('/admin/settings'),
  update: (settings: { key: string; value: unknown }[]) => api.post('/admin/settings/update', { settings }),
};

// Payments
export const paymentsApi = {
  initialize: (data: Record<string, unknown>) => api.post('/payments/initialize', data),
  verify: (data: { booking_id: string; reference: string }) => api.post('/payments/verify', data),
};

// Chatbot
export const chatApi = {
  sendMessage: (message: string) => api.post('/chat', { message }),
};

export default api;
