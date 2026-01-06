import axios, { type InternalAxiosRequestConfig, AxiosHeaders } from 'axios';

// Base Clients
// Base Clients - Use relative paths so Nginx Gateway handles routing whether on localhost or VM
export const userApi = axios.create({ baseURL: '/api/users' });
export const teamApi = axios.create({ baseURL: '/api/teams' });
export const taskApi = axios.create({ baseURL: '/api/tasks' });

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