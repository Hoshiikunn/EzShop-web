import { requestJson } from '@/api/client';
import type {
  Page,
  RolePageQuery,
  RolePageItem,
  RoleInfo,
  RoleId,
  RoleListItem,
  RoleCreatePayload,
  RoleUpdatePayload,
  RoleDeleteQuery,
  RoleStatusPayload,
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
  list() {
    return requestJson<RoleListItem[]>({
      url: '/admin/sys/role/list',
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
  changeStatus(payload: RoleStatusPayload) {
    return requestJson<null>({
      url: '/admin/sys/role/change/status',
      method: 'post',
      data: payload,
    });
  },
  remove(id: RoleId, query: RoleDeleteQuery = {}) {
    return requestJson<null>({
      url: `/admin/sys/role/${id}`,
      method: 'delete',
      params: query,
    });
  },
};
