import type { Component } from 'vue';
import type { RouteRecordRaw } from 'vue-router';
import type { MenuTreeNode } from '@/types/api';

const viewModules = import.meta.glob('../views/**/*.vue') as Record<
  string,
  () => Promise<{ default: Component }>
>;

export interface MenuRouteItem {
  id: string;
  menuName: string;
  path: string;
  icon?: string;
}

export type MenuRoute = RouteRecordRaw;

function normalizeRoutePath(value: string): string {
  return value.replace(/\/{2,}/g, '/');
}

function normalizeComponentPath(value: string): string {
  return value
    .trim()
    .replace(/^\/+/, '')
    .replace(/^@\/?/, '')
    .replace(/^\.\//, '')
    .replace(/^views\//, '');
}

export function buildMenuRoutePath(node: MenuTreeNode, parentPath = ''): string {
  const path = node.path?.trim();

  if (!path) {
    return '';
  }

  const parent = parentPath.endsWith('/') ? parentPath.slice(0, -1) : parentPath;

  return normalizeRoutePath(`${parent}/${path}`);
}

export function resolveViewComponent(component?: string | null) {
  if (!component) {
    return undefined;
  }

  const normalized = normalizeComponentPath(component);

  if (!normalized) {
    return undefined;
  }

  const key = `../views/${normalized}`;

  return viewModules[key] ?? viewModules[`${key}.vue`];
}

export function buildMenuRoutes(nodes: MenuTreeNode[], parentPath = ''): MenuRoute[] {
  return nodes.flatMap((node) => {
    const routePath = buildMenuRoutePath(node, parentPath);

    if (node.menuType === 'M') {
      return buildMenuRoutes(node.children ?? [], routePath);
    }

    if (node.menuType !== 'C' || !routePath || routePath === '/dashboard') {
      return [];
    }

    return [
      {
        path: routePath,
        name: `menu-${node.id}`,
        component: resolveViewComponent(node.component) ?? (() => import('../views/NotFoundView.vue')),
        meta: {
          title: node.menuName,
          menuId: node.id,
          perms: node.perms,
        },
      } satisfies RouteRecordRaw,
    ];
  });
}

export function collectMenuPermissions(nodes: MenuTreeNode[]): string[] {
  const permissions = nodes.flatMap((node) => [
    ...(node.menuType === 'F' && node.perms ? [node.perms] : []),
    ...collectMenuPermissions(node.children ?? []),
  ]);

  return Array.from(new Set(permissions));
}

export function flattenVisibleMenuItems(
  nodes: MenuTreeNode[],
  parentPath = '',
): MenuRouteItem[] {
  return nodes.flatMap((node) => {
    if (node.menuType === 'F' || node.visible !== 1) {
      return [];
    }

    const routePath = buildMenuRoutePath(node, parentPath);

    if (node.menuType === 'M') {
      return flattenVisibleMenuItems(node.children ?? [], routePath);
    }

    if (!routePath) {
      return [];
    }

    return [
      {
        id: node.id,
        menuName: node.menuName,
        path: routePath,
        icon: node.icon,
      },
    ];
  });
}
