import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me')
};

// Profile API
export const profileAPI = {
  getAll: (params) => api.get('/profile', { params }),
  getById: (id) => api.get(`/profile/${id}`),
  getMyProfile: () => api.get('/profile/me'),
  update: (id, data) => api.put(`/profile/${id}`, data)
};

// Attendance API
export const attendanceAPI = {
  checkIn: (data) => api.post('/attendance/checkin', data),
  checkOut: (data) => api.post('/attendance/checkout', data),
  getToday: () => api.get('/attendance/today'),
  getAll: (params) => api.get('/attendance', { params }),
  update: (id, data) => api.put(`/attendance/${id}`, data)
};

// Leave API
export const leaveAPI = {
  create: (data) => api.post('/leave', data),
  getAll: (params) => api.get('/leave', { params }),
  getById: (id) => api.get(`/leave/${id}`),
  approve: (id, data) => api.put(`/leave/${id}/approve`, data),
  reject: (id, data) => api.put(`/leave/${id}/reject`, data)
};

// Payroll API
export const payrollAPI = {
  getAll: (params) => api.get('/payroll', { params }),
  getById: (id) => api.get(`/payroll/${id}`),
  create: (data) => api.post('/payroll', data),
  update: (id, data) => api.put(`/payroll/${id}`, data)
};

export default api;

