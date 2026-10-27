import { requestJson } from '@/api/client';
import type { LoginPayload, LoginToken } from '@/types/api';

export const authApi = {
  login(payload: LoginPayload) {
    return requestJson<LoginToken>({
      url: '/admin/auth/login',
      method: 'post',
      data: payload,
    });
  },
  logout() {
    return requestJson<null>({
      url: '/admin/auth/logout',
      method: 'post',
    });
  },
};
