import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useAuthStore } from '@/stores/auth';

vi.mock('@/api/auth', () => ({
  authApi: {
    login: vi.fn().mockResolvedValue({
      token: 'new-token',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    }),
    logout: vi.fn().mockResolvedValue(null),
  },
}));

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('persists a successful login', async () => {
    const store = useAuthStore();

    await store.login({ username: 'admin', password: 'password' });

    expect(store.isAuthenticated).toBe(true);
    expect(localStorage.getItem('ezshop.admin.token')).toBe('new-token');
  });

  it('clears the session after logout even when the API fails', async () => {
    const store = useAuthStore();

    await store.login({ username: 'admin', password: 'password' });
    await store.logout();

    expect(store.isAuthenticated).toBe(false);
    expect(localStorage.getItem('ezshop.admin.token')).toBeNull();
  });
});
