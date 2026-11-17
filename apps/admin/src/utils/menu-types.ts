import type { MenuType } from '@/types/api';

export const MENU_TYPE_LABELS: Record<MenuType, string> = {
  M: '目录',
  C: '菜单',
  F: '权限',
};

export const MENU_TYPE_TAG_TYPES: Record<MenuType, 'primary' | 'success' | 'warning'> = {
  M: 'primary',
  C: 'success',
  F: 'warning',
};

export function getMenuTypeLabel(menuType: string): string {
  return MENU_TYPE_LABELS[menuType as MenuType] ?? '未知';
}

export function getMenuTypeTagType(menuType: string): 'primary' | 'success' | 'warning' {
  return MENU_TYPE_TAG_TYPES[menuType as MenuType] ?? 'primary';
}
