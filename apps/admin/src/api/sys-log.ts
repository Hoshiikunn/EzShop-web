import { requestJson } from '@/api/client';
import type {
  LoginLogPageItem,
  LoginLogPageQuery,
  OperLogPageItem,
  OperLogPageQuery,
  Page,
} from '@/types/api';

export const sysLogApi = {
  loginPage(params: LoginLogPageQuery) {
    return requestJson<Page<LoginLogPageItem>>({
      url: '/admin/sys/log/login/page',
      method: 'get',
      params,
    });
  },
  operPage(params: OperLogPageQuery) {
    return requestJson<Page<OperLogPageItem>>({
      url: '/admin/sys/log/oper/page',
      method: 'get',
      params,
    });
  },
};
