import { springApi } from './api';

export const authService = {
  async login(email, password, role) {
    const response = await springApi.post('/auth/login', { email, password, role });
    return response.data;
  },

  async register(userData) {
    const response = await springApi.post('/auth/register', userData);
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getToken() {
    return localStorage.getItem('token');
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  }
};
