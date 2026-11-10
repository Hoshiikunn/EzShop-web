import { requestJson } from '@/api/client';
import type { MenuTreeNode } from '@/types/api';

export const sysMenuApi = {
  tree() {
    return requestJson<MenuTreeNode[]>({
      url: '/admin/sys/menu/tree',
      method: 'get',
    });
  },
};
