import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (email: string, password: string, firstName: string, lastName: string) =>
    api.post('/auth/register', { email, password, firstName, lastName }),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/auth/change-password', { currentPassword, newPassword }),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
};

export const tripsAPI = {
  create: (data: any) => api.post('/trips', data),
  getAll: () => api.get('/trips'),
  getById: (id: string) => api.get(`/trips/${id}`),
  update: (id: string, data: any) => api.put(`/trips/${id}`, data),
  approve: (id: string) => api.post(`/trips/${id}/approve`),
  reject: (id: string, reason: string) => api.post(`/trips/${id}/reject`, { reason }),
  delete: (id: string) => api.delete(`/trips/${id}`),
  getMyTrips: () => api.get('/trips/my-trips'),
};

export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  getById: (id: string) => api.get(`/notifications/${id}`),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

export const destinationsAPI = {
  getAll: () => api.get('/destinations'),
  getById: (id: string) => api.get(`/destinations/${id}`),
  search: (query: string) => api.get('/destinations/search', { params: { query } }),
};

export const hotelsAPI = {
  getAll: () => api.get('/hotels'),
  getById: (id: string) => api.get(`/hotels/${id}`),
  search: (query: string) => api.get('/hotels/search', { params: { query } }),
  getByDestination: (destinationId: string) =>
    api.get(`/hotels/destination/${destinationId}`),
};

export const bookingsAPI = {
  create: (data: any) => api.post('/bookings', data),
  getAll: () => api.get('/bookings'),
  getById: (id: string) => api.get(`/bookings/${id}`),
  cancel: (id: string) => api.post(`/bookings/${id}/cancel`),
};

export const paymentsAPI = {
  initialize: (data: any) => api.post('/payments/initialize', data),
  verify: (reference: string) => api.get(`/payments/verify/${reference}`),
};

export const adminAPI = {
  settings: {
    get: () => api.get('/admin/settings'),
    setMaintenance: (enabled: boolean) =>
      api.post('/admin/settings/maintenance-mode', { enabled }),
    sendAlert: (message: string) =>
      api.post('/admin/settings/alerts/send', { message }),
  },
  users: {
    getAll: () => api.get('/admin/users'),
    getById: (id: string) => api.get(`/admin/users/${id}`),
    resetPassword: (id: string) => api.post(`/admin/users/${id}/reset-password`),
    suspend: (id: string) => api.post(`/admin/users/${id}/suspend`),
    activate: (id: string) => api.post(`/admin/users/${id}/activate`),
  },
  trips: {
    getPending: () => api.get('/admin/trips/pending'),
    approve: (id: string) => api.post(`/admin/trips/${id}/approve`),
    reject: (id: string, reason: string) =>
      api.post(`/admin/trips/${id}/reject`, { reason }),
  },
  auditLogs: {
    getAll: () => api.get('/admin/audit-logs'),
  },
};

export default api;
