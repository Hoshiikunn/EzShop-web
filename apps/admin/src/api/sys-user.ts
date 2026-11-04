import { requestJson } from '@/api/client';
import type { Page, UserPageQuery, UserPageItem, UserInfo, UserId } from '@/types/api';

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
};
