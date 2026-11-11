import { requestJson } from '@/api/client';
import type {
  Page,
  RolePageQuery,
  RolePageItem,
  RoleInfo,
  RoleId,
  RoleCreatePayload,
  RoleUpdatePayload,
} from '@/types/api';

export const sysRoleApi = {
  page(params: RolePageQuery) {
    return requestJson<Page<RolePageItem>>({
      url: '/admin/sys/role/page',
      method: 'get',
      params,
    });
  },
  info(id: RoleId) {
    return requestJson<RoleInfo>({
      url: `/admin/sys/role/${id}`,
      method: 'get',
    });
  },
  add(payload: RoleCreatePayload) {
    return requestJson<null>({
      url: '/admin/sys/role/add',
      method: 'post',
      data: payload,
    });
  },
  update(payload: RoleUpdatePayload) {
    return requestJson<null>({
      url: '/admin/sys/role/update',
      method: 'put',
      data: payload,
    });
  },
};
