const TOKEN_KEY = 'ezshop.admin.token';
const EXPIRES_AT_KEY = 'ezshop.admin.expiresAt';

export const tokenStorage = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  getExpiresAt(): number | null {
    const value = localStorage.getItem(EXPIRES_AT_KEY);
    const parsed = value ? Number(value) : Number.NaN;
    return Number.isFinite(parsed) ? parsed : null;
  },
  set(token: string, expiresAt: string | number): void {
    const timestamp = new Date(expiresAt).getTime();

    if (!token || !Number.isFinite(timestamp)) {
      throw new Error('登录令牌信息无效');
    }

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(EXPIRES_AT_KEY, String(timestamp));
  },
  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRES_AT_KEY);
  },
  hasValidToken(): boolean {
    const expiresAt = this.getExpiresAt();

    return Boolean(this.getToken() && expiresAt && expiresAt > Date.now());
  },
};
