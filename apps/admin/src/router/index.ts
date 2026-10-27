import { createRouter, createWebHistory } from 'vue-router';
import { tokenStorage } from '@/utils/token-storage';

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
          path: 'users',
          name: 'users',
          component: () => import('@/views/UsersView.vue'),
          meta: { title: '用户管理' },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/dashboard',
    },
  ],
});

router.beforeEach((to) => {
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

  return true;
});

export default router;
