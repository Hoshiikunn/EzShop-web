import { requestJson } from '@/api/client';
import type {
  ProfileChangePasswordPayload,
  ProfileChangeUsernamePayload,
  ProfileInfo,
} from '@/types/api';

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
  changePassword(payload: ProfileChangePasswordPayload) {
    return requestJson<null>({
      url: '/admin/profile/change/password',
      method: 'put',
      data: payload,
    });
  },
  changeUsername(payload: ProfileChangeUsernamePayload) {
    return requestJson<null>({
      url: '/admin/profile/change/username',
      method: 'put',
      data: payload,
    });
  },
};
