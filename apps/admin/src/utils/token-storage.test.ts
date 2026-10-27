import { describe, expect, it } from 'vitest';
import { tokenStorage } from '@/utils/token-storage';

describe('tokenStorage', () => {
  it('stores a token and expiry timestamp', () => {
    const expiresAt = new Date(Date.now() + 60_000);

    tokenStorage.set('token-value', expiresAt.toISOString());

    expect(tokenStorage.getToken()).toBe('token-value');
    expect(tokenStorage.getExpiresAt()).toBe(expiresAt.getTime());
    expect(tokenStorage.hasValidToken()).toBe(true);
  });

  it('rejects an invalid expiry timestamp', () => {
    expect(() => tokenStorage.set('token-value', 'not-a-date')).toThrow('登录令牌信息无效');
  });

  it('clears the local session', () => {
    tokenStorage.set('token-value', new Date(Date.now() + 60_000).toISOString());
    tokenStorage.clear();

    expect(tokenStorage.getToken()).toBeNull();
    expect(tokenStorage.hasValidToken()).toBe(false);
  });
});
