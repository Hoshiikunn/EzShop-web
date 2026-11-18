import { defineStore } from 'pinia';
import type { Router } from 'vue-router';
import { authApi } from '@/api/auth';
import type { MenuTreeNode } from '@/types/api';
import {
  buildMenuRoutes,
  collectMenuPermissions,
  flattenVisibleMenuItems,
  type MenuRoute,
  type MenuRouteItem,
} from '@/utils/dynamic-routes';

let ensurePromise: Promise<void> | null = null;

async function loadNavigation(router: Router) {
  const navTree = await authApi.nav();
  const routes = buildMenuRoutes(navTree);
  const store = useNavigationStore();

  for (const route of store.dynamicRoutes) {
    if (router.hasRoute(route.name)) {
      router.removeRoute(route.name);
    }
  }

  for (const route of routes) {
    router.addRoute('admin', route);
  }

  store.navTree = navTree;
  store.menuItems = flattenVisibleMenuItems(navTree);
  store.permissions = collectMenuPermissions(navTree);
  store.dynamicRoutes = routes;
  store.initialized = true;
}

export const useNavigationStore = defineStore('navigation', {
  state: () => ({
    navTree: [] as MenuTreeNode[],
    menuItems: [] as MenuRouteItem[],
    permissions: [] as string[],
    dynamicRoutes: [] as MenuRoute[],
    initialized: false,
  }),
  getters: {
    hasRoute: (state) => (path: string) =>
      state.dynamicRoutes.some((route) => route.path === path),
  },
  actions: {
    async ensureNavigation(router: Router) {
      if (!ensurePromise) {
        ensurePromise = loadNavigation(router).catch((error) => {
          ensurePromise = null;
          throw error;
        });
      }

      await ensurePromise;
    },
    reset() {
      ensurePromise = null;
      this.navTree = [];
      this.menuItems = [];
      this.permissions = [];
      this.initialized = false;
    },
  },
});
