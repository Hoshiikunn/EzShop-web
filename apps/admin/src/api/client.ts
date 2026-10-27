import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import type { Result } from '@/types/api';
import { tokenStorage } from '@/utils/token-storage';

export class ApiError extends Error {
  readonly code: number;

  constructor(code: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
});

client.interceptors.request.use((config) => {
  const token = tokenStorage.getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error: AxiosError<Result<unknown>>) => {
    if (error.response?.status === 401) {
      tokenStorage.clear();
      window.location.href = '/login';
    }

    return Promise.reject(error);
  },
);

export async function requestJson<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await client.request<Result<T>>(config);
    const payload = response.data;

    if (payload.code !== 200) {
      throw new ApiError(payload.code, payload.msg);
    }

    return payload.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (axios.isAxiosError(error)) {
      const payload = error.response?.data;

      if (payload && typeof payload === 'object' && 'code' in payload && 'msg' in payload) {
        throw new ApiError(payload.code, payload.msg);
      }

      throw new ApiError(error.response?.status ?? 500, error.message || '网络请求失败');
    }

    throw new ApiError(500, '发生未知错误');
  }
}
