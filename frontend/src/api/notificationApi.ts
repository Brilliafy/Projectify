import axios from 'axios';

const BASE_URL = '/api/notifications';

export const notificationApi = axios.create({
  baseURL: BASE_URL,
});

notificationApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
