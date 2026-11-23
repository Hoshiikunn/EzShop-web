import { requestJson } from '@/api/client';
import type { ProfileInfo } from '@/types/api';

export const profileApi = {
  info() {
    return requestJson<ProfileInfo>({
      url: '/admin/profile',
      method: 'get',
    });
  },
  roles() {
    return requestJson<string[]>({
      url: '/admin/profile/roles',
      method: 'get',
    });
  },
};
