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
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      refreshAccessToken: async () => {
        try {
          const { refreshToken } = get();
          if (!refreshToken) throw new Error('No refresh token');
          
          const response = await axios.post('/api/auth/refresh', { refreshToken });
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data;
          set({ accessToken: newAccessToken, refreshToken: newRefreshToken });
        } catch {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          });
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
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          await useAuthStore.getState().refreshAccessToken();
          const state = useAuthStore.getState();
          originalRequest.headers.Authorization = `Bearer ${state.accessToken}`;
          return axios(originalRequest);
        } catch {
          useAuthStore.getState().logout();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
      }
      return Promise.reject(error);
    }
  );
}
