import axios from 'axios';

const springApi = axios.create({
  baseURL: import.meta.env.VITE_SPRING_API_URL || 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
});

// Removed pythonApi as all traffic goes to springApi

// Request interceptor to attach JWT token
const attachToken = (config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

springApi.interceptors.request.use(attachToken);


// Response interceptor for 401 handling
const handleUnauthorized = (error) => {
  if (error.response?.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
  return Promise.reject(error);
};

springApi.interceptors.response.use((res) => res, handleUnauthorized);

export { springApi };
