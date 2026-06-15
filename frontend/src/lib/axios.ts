import axios from 'axios';

function getBaseUrl(): string {
  const stored = localStorage.getItem('backend_base_url');
  if (stored) return stored.replace(/\/$/, '');
  return '';
}

const api = axios.create({
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dynamically set baseURL before every request so it picks up changes to localStorage
api.interceptors.request.use((config) => {
  config.baseURL = getBaseUrl();
  return config;
});

export default api;
