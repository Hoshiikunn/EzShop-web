import { requestJson } from '@/api/client';
import type {
  Page,
  UserPageQuery,
  UserPageItem,
  UserInfo,
  UserId,
  UserCreatePayload,
  UserInitInfo,
  UserUpdatePayload,
} from '@/types/api';

export const sysUserApi = {
  page(params: UserPageQuery) {
    return requestJson<Page<UserPageItem>>({
      url: '/admin/sys/user/page',
      method: 'get',
      params,
    });
  },
  info(id: UserId) {
    return requestJson<UserInfo>({
      url: `/admin/sys/user/${id}`,
      method: 'get',
    });
  },
  add(payload: UserCreatePayload) {
    return requestJson<UserInitInfo>({
      url: '/admin/sys/user/add',
      method: 'post',
      data: payload,
    });
  },
  update(payload: UserUpdatePayload) {
    return requestJson<null>({
      url: '/admin/sys/user/update',
      method: 'put',
      data: payload,
    });
  },
};
