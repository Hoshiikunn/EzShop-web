import { requestJson } from '@/api/client';
import type { LoginLogPageItem, LoginLogPageQuery, Page } from '@/types/api';

export const sysLogApi = {
  loginPage(params: LoginLogPageQuery) {
    return requestJson<Page<LoginLogPageItem>>({
      url: '/admin/sys/log/login/page',
      method: 'get',
      params,
    });
  },
};
