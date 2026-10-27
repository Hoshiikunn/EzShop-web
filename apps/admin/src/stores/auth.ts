import { defineStore } from 'pinia';
import { authApi } from '@/api/auth';
import { tokenStorage } from '@/utils/token-storage';
import type { LoginPayload } from '@/types/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: tokenStorage.getToken(),
    expiresAt: tokenStorage.getExpiresAt(),
  }),
  getters: {
    isAuthenticated: (state) =>
      Boolean(state.token && state.expiresAt && state.expiresAt > Date.now()),
  },
  actions: {
    async login(payload: LoginPayload) {
      const result = await authApi.login(payload);
      tokenStorage.set(result.token, result.expiresAt);

      this.token = result.token;
      this.expiresAt = new Date(result.expiresAt).getTime();
    },
    async logout() {
      try {
        await authApi.logout();
      } finally {
        tokenStorage.clear();
        this.token = null;
        this.expiresAt = null;
      }
    },
    clearLocalSession() {
      tokenStorage.clear();
      this.token = null;
      this.expiresAt = null;
    },
  },
});
