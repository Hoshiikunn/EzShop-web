import { createRouter, createWebHistory } from 'vue-router';
import { tokenStorage } from '@/utils/token-storage';
import { useNavigationStore } from '@/stores/navigation';
import { usePermissionStore } from '@/stores/permissions';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { public: true },
    },
    {
      name: 'admin',
      path: '/',
      component: () => import('@/layouts/AdminLayout.vue'),
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/views/DashboardView.vue'),
          meta: { title: '仪表盘' },
        },
        {
          path: 'profile',
          name: 'profile',
          component: () => import('@/views/ProfileView.vue'),
          meta: { title: '个人中心' },
        },
      ],
    },
    {
      name: 'not-found',
      path: '/:pathMatch(.*)*',
      component: () => import('@/views/NotFoundView.vue'),
    },
  ],
});

router.beforeEach(async (to) => {
  if (to.meta.public) {
    return true;
  }

  if (!tokenStorage.hasValidToken()) {
    const isRootEntry = to.path === '/' || to.redirectedFrom?.path === '/';

    return {
      name: 'login',
      query: isRootEntry ? undefined : { redirect: to.fullPath },
    };
  }

  if (to.name === 'not-found') {
    const navigationStore = useNavigationStore();
    await navigationStore.ensureNavigation(router);

    if (navigationStore.hasRoute(to.path)) {
      return {
        path: to.path,
        query: to.query,
        hash: to.hash,
        replace: true,
      };
    }
  }

  const permissionStore = usePermissionStore();
  await permissionStore.ensurePermissions();

  return true;
});

export default router;
