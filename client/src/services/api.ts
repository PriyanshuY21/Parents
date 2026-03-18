import axios, { AxiosError } from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor — surface clean error messages
api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<{ error?: string; errors?: Array<{ msg: string }> }>) => {
    const message =
      err.response?.data?.error ??
      err.response?.data?.errors?.[0]?.msg ??
      err.message ??
      'An unexpected error occurred.';
    return Promise.reject(new Error(message));
  }
);

export default api;
