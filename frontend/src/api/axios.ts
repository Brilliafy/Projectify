import axios, { type InternalAxiosRequestConfig, AxiosHeaders } from 'axios';
import { handleMockRequest } from '../demo/mockBackend';

// Base Clients configured with Offline Mock Adapter for Static Demo
export const userApi = axios.create({
  baseURL: '/api/users',
  adapter: handleMockRequest,
});

export const teamApi = axios.create({
  baseURL: '/api/teams',
  adapter: handleMockRequest,
});

export const taskApi = axios.create({
  baseURL: '/api/tasks',
  adapter: handleMockRequest,
});

// Token Interceptor Function
const addToken = (config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = AxiosHeaders.from({
      ...config.headers,
      Authorization: `Bearer ${token}`,
    });
  }
  return config;
};

// Apply Interceptors
userApi.interceptors.request.use(addToken);
teamApi.interceptors.request.use(addToken);
taskApi.interceptors.request.use(addToken);
