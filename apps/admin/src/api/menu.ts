import { requestJson } from '@/api/client';

export interface MenuNode {
  id: number;
  parentId?: number;
  title: string;
  path?: string;
  icon?: string;
  sort?: number;
  visible?: 0 | 1;
  children?: MenuNode[];
}

export const menuApi = {
  /**
   * 后端菜单接口尚未实现；这里先约定 GET /admin/sys/menu/list。
   * 接口路径和返回结构确定后，再接入侧边栏。
   */
  list() {
    return requestJson<MenuNode[]>({
      url: '/admin/sys/menu/list',
      method: 'get',
    });
  },
};
