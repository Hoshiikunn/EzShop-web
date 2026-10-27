import { beforeEach, describe, expect, it, vi } from 'vitest';
import router from '@/router';
import { tokenStorage } from '@/utils/token-storage';

vi.mock('@/utils/token-storage', () => ({
  tokenStorage: {
    hasValidToken: vi.fn(),
  },
}));

const hasValidToken = vi.mocked(tokenStorage.hasValidToken);

describe('router guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasValidToken.mockReturnValue(false);
  });

  it('sends unauthenticated root visits to login without a redirect query', async () => {
    await router.push('/');
    await router.isReady();

    expect(router.currentRoute.value.path).toBe('/login');
    expect(router.currentRoute.value.query).toEqual({});
  });

  it('keeps the target path for other protected pages', async () => {
    await router.push('/users');
    await router.isReady();

    expect(router.currentRoute.value.path).toBe('/login');
    expect(router.currentRoute.value.query.redirect).toBe('/users');
  });

  it('allows protected pages after authentication', async () => {
    hasValidToken.mockReturnValue(true);

    await router.push('/dashboard');
    await router.isReady();

    expect(router.currentRoute.value.path).toBe('/dashboard');
  });
});
