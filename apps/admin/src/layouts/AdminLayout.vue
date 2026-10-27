<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { LayoutDashboard, Menu, Settings, Users, LogOut } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const navigation = [
  { path: '/dashboard', title: '仪表盘', icon: LayoutDashboard },
  { path: '/users', title: '用户管理', icon: Users },
];

const activePath = computed(() => route.path);

async function handleLogout() {
  await ElMessageBox.confirm('确定要退出登录吗？', '退出登录', {
    confirmButtonText: '退出',
    cancelButtonText: '取消',
    type: 'warning',
  });

  await authStore.logout();
  ElMessage.success('已退出登录');
  await router.replace('/login');
}
</script>

<template>
  <div class="admin-shell">
    <aside class="sidebar">
      <RouterLink to="/dashboard" class="brand">
        <span class="brand-icon">E</span>
        <span>EzShop</span>
      </RouterLink>

      <nav class="nav">
        <RouterLink
          v-for="item in navigation"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: activePath === item.path }"
        >
          <component :is="item.icon" :size="18" />
          <span>{{ item.title }}</span>
        </RouterLink>

        <button class="nav-item reserved" type="button" disabled>
          <Menu :size="18" />
          <span>动态菜单</span>
          <small>预留</small>
        </button>
      </nav>

      <div class="sidebar-footer">
        <Settings :size="16" />
        <span>系统模块开发中</span>
      </div>
    </aside>

    <div class="workspace">
      <header class="topbar">
        <div>
          <h1>{{ route.meta.title || 'EzShop Admin' }}</h1>
          <p>SpringBoot 后台控制台</p>
        </div>

        <button class="logout-button" type="button" @click="handleLogout">
          <LogOut :size="16" />
          退出
        </button>
      </header>

      <main class="content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-shell {
  display: grid;
  grid-template-columns: 232px minmax(0, 1fr);
  min-height: 100vh;
}

.sidebar {
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 22px 16px;
  border-right: 1px solid var(--ez-line);
  background: #fff;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 10px 22px;
  color: var(--ez-ink);
  text-decoration: none;
  font-size: 18px;
  font-weight: 800;
}

.brand-icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  color: #fff;
  background: var(--ez-primary);
}

.nav {
  display: grid;
  gap: 6px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 42px;
  padding: 0 12px;
  border: 0;
  border-radius: 10px;
  color: #626f8a;
  text-align: left;
  text-decoration: none;
  background: transparent;
  cursor: pointer;
  transition:
    background 0.18s ease,
    color 0.18s ease;
}

.nav-item.active,
.nav-item:hover {
  color: var(--ez-primary-dark);
  background: #eef3ff;
}

.nav-item.reserved {
  opacity: 0.6;
  cursor: not-allowed;
}

.nav-item small {
  margin-left: auto;
  color: var(--ez-muted);
  font-size: 11px;
}

.sidebar-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: auto;
  padding-top: 18px;
  color: var(--ez-muted);
  font-size: 12px;
}

.workspace {
  display: grid;
  align-content: start;
  min-width: 0;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 32px;
  border-bottom: 1px solid var(--ez-line);
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(16px);
}

.topbar h1 {
  margin: 0;
  font-size: 24px;
}

.topbar p {
  margin: 4px 0 0;
  color: var(--ez-muted);
  font-size: 13px;
}

.logout-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 14px;
  border: 1px solid var(--ez-line);
  border-radius: 9px;
  color: #4d5a75;
  background: #fff;
  cursor: pointer;
  transition:
    color 0.2s ease,
    border-color 0.2s ease;
}

.logout-button:hover {
  color: #d2494a;
  border-color: rgba(210, 73, 74, 0.32);
}

.content {
  min-width: 0;
  padding: 28px 32px 36px;
}

@media (max-width: 760px) {
  .admin-shell {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: relative;
    height: auto;
  }

  .nav {
    grid-auto-flow: column;
    overflow-x: auto;
  }

  .sidebar-footer {
    display: none;
  }

  .topbar,
  .content {
    padding-inline: 16px;
  }
}
</style>
