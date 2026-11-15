import { requestJson } from '@/api/client';
import type { MenuCreatePayload, MenuId, MenuInfo, MenuItem, MenuTreeNode } from '@/types/api';

export const sysMenuApi = {
  tree() {
    return requestJson<MenuTreeNode[]>({
      url: '/admin/sys/menu/tree',
      method: 'get',
    });
  },
  info(id: MenuId) {
    return requestJson<MenuInfo>({
      url: `/admin/sys/menu/${id}`,
      method: 'get',
    });
  },
  list() {
    return requestJson<MenuItem[]>({
      url: '/admin/sys/menu/list',
      method: 'get',
    });
  },
  add(payload: MenuCreatePayload) {
    return requestJson<null>({
      url: '/admin/sys/menu/add',
      method: 'post',
      data: payload,
    });
  },
};
