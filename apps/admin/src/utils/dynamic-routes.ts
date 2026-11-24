import type { Component } from 'vue';
import type { RouteRecordRaw } from 'vue-router';
import type { MenuTreeNode } from '@/types/api';

const viewModules = import.meta.glob('../views/**/*.vue') as Record<
  string,
  () => Promise<{ default: Component }>
>;

export interface SidebarMenuItem {
  id: string;
  menuName: string;
  path?: string;
  icon?: string;
  children: SidebarMenuItem[];
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

export function buildSidebarTree(
  nodes: MenuTreeNode[],
  parentPath = '',
): SidebarMenuItem[] {
  return nodes.flatMap((node) => {
    if (node.menuType === 'F' || node.visible !== 1) {
      return [];
    }

    const routePath = buildMenuRoutePath(node, parentPath);

    if (node.menuType === 'M') {
      const children = buildSidebarTree(node.children ?? [], routePath);

      if (children.length === 0) {
        return [];
      }

      return [
        {
          id: node.id,
          menuName: node.menuName,
          icon: node.icon,
          children,
        },
      ];
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
          children: [],
      },
    ];
  });
}

export function collectActiveMenuIds(
  nodes: SidebarMenuItem[],
  activePath: string,
): string[] {
  return nodes.flatMap((node) => {
    const activeChildIds = collectActiveMenuIds(node.children, activePath);

    if (node.path === activePath || activeChildIds.length > 0) {
      return [node.id, ...activeChildIds];
    }

    return [];
  });
}
