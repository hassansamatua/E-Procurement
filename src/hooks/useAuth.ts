"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import { UserRole } from '@/types';

interface AuthUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  organization_id?: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: Record<string, unknown>) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      setLoading: (loading: boolean) => set({ isLoading: loading }),

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await axios.post('/api/auth/login', { email, password });
          const { user, accessToken, refreshToken } = response.data.data;
          // Reset refresh state on successful login
          refreshFailureCount = 0;
          refreshDisabled = false;
          isRefreshing = false;
          failedQueue = [];
          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: unknown) {
          set({ isLoading: false });
          if (axios.isAxiosError(error)) {
            throw new Error(error.response?.data?.message || 'Login failed');
          }
          throw error;
        }
      },

      register: async (data: Record<string, unknown>) => {
        set({ isLoading: true });
        try {
          await axios.post('/api/auth/register', data);
          set({ isLoading: false });
        } catch (error: unknown) {
          set({ isLoading: false });
          if (axios.isAxiosError(error)) {
            throw new Error(error.response?.data?.message || 'Registration failed');
          }
          throw error;
        }
      },

      logout: async () => {
        try {
          const { accessToken } = get();
          if (accessToken) {
            await axios.post('/api/auth/logout', {}, {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
          }
        } catch {
          // Ignore errors on logout
        }
        // Reset refresh state to prevent retry loops
        isRefreshing = false;
        refreshFailureCount = 0;
        failedQueue = [];
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
        // Clear localStorage to ensure no stale tokens remain
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-storage');
        }
      },

      refreshAccessToken: async () => {
        try {
          const { refreshToken } = get();
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }
          
          const response = await axios.post('/api/auth/refresh', { refreshToken });
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data;
          
          if (!newAccessToken || !newRefreshToken) {
            throw new Error('Invalid refresh response');
          }
          
          set({ accessToken: newAccessToken, refreshToken: newRefreshToken });
        } catch (error) {
          console.error('Token refresh failed:', error);
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          });
          throw error;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Axios interceptor setup
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: unknown) => void; reject: (reason?: unknown) => void }> = [];
let refreshFailureCount = 0;
let refreshDisabled = false;

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export function setupAxiosInterceptors() {
  axios.interceptors.request.use((config) => {
    const state = useAuthStore.getState();
    if (state.accessToken) {
      config.headers.Authorization = `Bearer ${state.accessToken}`;
    }
    return config;
  });

  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      const state = useAuthStore.getState();
      
      // Skip refresh for auth endpoints to prevent infinite loops
      if (originalRequest.url?.includes('/api/auth/')) {
        return Promise.reject(error);
      }
      
      // Don't attempt refresh if user is not authenticated or refresh is disabled
      if (!state.isAuthenticated || !state.refreshToken || refreshDisabled) {
        return Promise.reject(error);
      }
      
      // Stop retrying after 3 consecutive refresh failures
      if (refreshFailureCount >= 3) {
        refreshDisabled = true; // Disable refresh entirely
        await useAuthStore.getState().logout();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
      
      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axios(originalRequest);
          }).catch((err) => {
            return Promise.reject(err);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          await useAuthStore.getState().refreshAccessToken();
          const newState = useAuthStore.getState();
          if (!newState.accessToken) {
            throw new Error('No access token after refresh');
          }
          refreshFailureCount = 0; // Reset on success
          processQueue(null, newState.accessToken);
          originalRequest.headers.Authorization = `Bearer ${newState.accessToken}`;
          return axios(originalRequest);
        } catch (refreshError) {
          refreshFailureCount++;
          processQueue(refreshError, null);
          await useAuthStore.getState().logout();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }
      
      return Promise.reject(error);
    }
  );
}
