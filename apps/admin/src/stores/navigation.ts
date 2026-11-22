import { defineStore } from 'pinia';
import type { Router } from 'vue-router';
import { authApi } from '@/api/auth';
import type { MenuTreeNode } from '@/types/api';
import {
  buildMenuRoutes,
  buildSidebarTree,
  collectMenuPermissions,
  type MenuRoute,
  type SidebarMenuItem,
} from '@/utils/dynamic-routes';

let ensurePromise: Promise<void> | null = null;

async function loadNavigation(router: Router) {
  const navTree = await authApi.nav();
  const routes = buildMenuRoutes(navTree);
  const store = useNavigationStore();

  for (const route of store.dynamicRoutes) {
    const routeName = route.name;

    if (typeof routeName === 'string' && router.hasRoute(routeName)) {
      router.removeRoute(routeName);
    }
  }

  for (const route of routes) {
    router.addRoute('admin', route);
  }

  store.navTree = navTree;
  store.sidebarItems = buildSidebarTree(navTree);
  store.permissions = collectMenuPermissions(navTree);
  store.dynamicRoutes = routes;
  store.initialized = true;
}

export const useNavigationStore = defineStore('navigation', {
  state: () => ({
    navTree: [] as MenuTreeNode[],
    sidebarItems: [] as SidebarMenuItem[],
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
      this.sidebarItems = [];
      this.permissions = [];
      this.initialized = false;
    },
  },
});
