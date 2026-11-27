import { requestJson } from '@/api/client';
import type {
  LoginLogId,
  LoginLogPageItem,
  LoginLogPageQuery,
  OperLogId,
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
  batchDeleteLoginLog(logIds: LoginLogId[]) {
    return requestJson<null>({
      url: '/admin/sys/log/login/batch/delete',
      method: 'post',
      data: logIds,
    });
  },
  operPage(params: OperLogPageQuery) {
    return requestJson<Page<OperLogPageItem>>({
      url: '/admin/sys/log/oper/page',
      method: 'get',
      params,
    });
  },
  batchDeleteOperLog(logIds: OperLogId[]) {
    return requestJson<null>({
      url: '/admin/sys/log/oper/batch/delete',
      method: 'post',
      data: logIds,
    });
  },
};
